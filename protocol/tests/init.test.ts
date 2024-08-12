import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair } from "@solana/web3.js";
import {
  createTokenMint,
  initMarket,
  INVARIANT_ADDRESS,
  sleep,
} from "./test-utils";
import { Puppet } from "../sdk/dist/puppet";
import {
  getProgramAuthorityAddressAndBump,
  getPuppetCounterAddressAndBump,
} from "../sdk/src/utils";
import { assert } from "chai";
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { calculatePriceSqrt, Pair } from "@invariant-labs/sdk-eclipse";
import {
  fromFee,
  LIQUIDITY_DENOMINATOR,
  tou64,
} from "@invariant-labs/sdk-eclipse/lib/utils";
import {
  CreateTick,
  FeeTier,
  InitPosition,
  Market,
} from "@invariant-labs/sdk-eclipse/lib/market";

describe("init", () => {
  const { wallet: walletAnchor, connection } = AnchorProvider.local();
  const owner = Keypair.generate();
  const wallet = Keypair.generate();
  const mintAuthority = Keypair.generate();

  before(async () => {
    await Promise.all([connection.requestAirdrop(owner.publicKey, 1e14)]);
    await Promise.all([connection.requestAirdrop(wallet.publicKey, 1e14)]);
    await Promise.all([
      connection.requestAirdrop(mintAuthority.publicKey, 1e14),
    ]);
    await sleep(1000);
  });

  it("init works", async () => {
    const protocol = await Protocol.build(
      Network.LOCAL,
      walletAnchor,
      connection
    );

    await protocol.init(owner);
  });

  it("cpi works", async () => {
    const protocol = await Protocol.build(
      Network.LOCAL,
      walletAnchor,
      connection
    );
    const puppet = await Puppet.build(Network.LOCAL, walletAnchor, connection);

    const [puppetCounterAddress, bump] = getPuppetCounterAddressAndBump(
      puppet.program.programId
    );

    await protocol.test(
      {
        puppetProgram: puppet.program.programId,
        counter: puppetCounterAddress,
      },
      bump,
      owner
    );

    const stateAccount = await puppet.program.account.counter.fetch(
      puppetCounterAddress
    );
    assert.equal(stateAccount.owner?.toString(), owner.publicKey.toString());
    assert.equal(stateAccount.counter, 0);
    assert.equal(stateAccount.bump, bump);
  });

  it("mint works", async () => {
    const protocol = await Protocol.build(
      Network.LOCAL,
      walletAnchor,
      connection
    );
    protocol.init(owner);

    const [mintAuthority] = getProgramAuthorityAddressAndBump(
      protocol.program.programId
    );
    const tokenAmount = 100n;
    const tokenDecimals = 6;
    const mintAmount = new BN(tokenAmount * 10n ** BigInt(tokenDecimals));

    const payer = Keypair.generate();
    await connection.requestAirdrop(payer.publicKey, 1e9);
    await sleep(1000);

    const lpTokenMinter = await createTokenMint(
      connection,
      payer,
      mintAuthority,
      tokenDecimals
    );
    const lpTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      lpTokenMinter,
      payer.publicKey
    );

    {
      const lpTokenAccountInfo = await getAccount(
        connection,
        lpTokenAccount.address
      );
      assert.equal(lpTokenAccountInfo.amount, 0n);
    }

    await protocol.mint(
      lpTokenMinter,
      lpTokenAccount.address,
      mintAmount,
      payer
    );

    {
      const lpTokenAccountInfo = await getAccount(
        connection,
        lpTokenAccount.address
      );
      assert.equal(lpTokenAccountInfo.amount, mintAmount);
    }
  });

  it("invariant cpi works", async () => {
    const market = await Market.build(
      Network.LOCAL,
      walletAnchor,
      connection,
      INVARIANT_ADDRESS
    );

    const [tokenX, tokenY] = await Promise.all([
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
    ]);

    const feeTier: FeeTier = {
      fee: fromFee(new BN(600)),
      tickSpacing: 10,
    };
    const pair = new Pair(tokenX, tokenY, feeTier);

    const initTick = 0;
    await initMarket(market, [pair], owner, initTick);
    await market.createPositionList(owner.publicKey, owner);

    const lowerTick = -10;
    const upperTick = 10;
    const lowerTickVars: CreateTick = {
      pair,
      index: lowerTick,
      payer: owner.publicKey,
    };
    const upperTickVars: CreateTick = {
      pair,
      index: upperTick,
      payer: owner.publicKey,
    };
    await market.createTick(lowerTickVars, owner);
    await market.createTick(upperTickVars, owner);

    const userTokenXAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      tokenX,
      owner.publicKey
    );
    const userTokenYAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      tokenY,
      owner.publicKey
    );

    const xOwnerAmount = 1e10;
    const yOwnerAmount = 1e10;

    await mintTo(
      connection,
      owner,
      tokenX,
      userTokenXAccount.address,
      mintAuthority,
      xOwnerAmount
    );
    await mintTo(
      connection,
      owner,
      tokenY,
      userTokenYAccount.address,
      mintAuthority,
      yOwnerAmount
    );

    const liquidityDelta = { v: LIQUIDITY_DENOMINATOR.muln(10_000) };
    const position: InitPosition = {
      pair,
      owner: owner.publicKey,
      userTokenX: userTokenXAccount.address,
      userTokenY: userTokenYAccount.address,
      lowerTick,
      upperTick,
      liquidityDelta,
      knownPrice: calculatePriceSqrt(initTick),
      slippage: { v: new BN(0) },
    };
    await market.initPosition(position, owner);

    const protocol = await Protocol.build(
      Network.LOCAL,
      walletAnchor,
      connection
    );

    const poolAddress = await pair.getAddress(INVARIANT_ADDRESS);
    const { positionAddress } = await market.getPositionAddress(
      owner.publicKey,
      0
    );
    const { tickAddress: lowerTickAddress } = await market.getTickAddress(
      pair,
      -10
    );
    const { tickAddress: upperTickAddress } = await market.getTickAddress(
      pair,
      10
    );

    const positionBefore = await market.getPosition(owner.publicKey, 0);

    await sleep(1000);

    await protocol.invokeUpdateSecondsPerLiquidity(
      {
        invariantProgram: INVARIANT_ADDRESS,
        pool: poolAddress,
        lowerTick: lowerTickAddress,
        upperTick: upperTickAddress,
        position: positionAddress,
        tokenX,
        tokenY,
        owner: owner.publicKey,
      },
      lowerTick,
      upperTick,
      initTick,
      owner
    );

    const positionAfter = await market.getPosition(owner.publicKey, 0);
    assert.ok(
      positionAfter.secondsPerLiquidityInside.v.gt(
        positionBefore.secondsPerLiquidityInside.v
      )
    );
  });
});
