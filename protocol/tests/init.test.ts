import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createTokenMint,
  initMarket,
  INVARIANT_ADDRESS,
  sleep,
} from "./test-utils";
import { Puppet } from "../sdk/dist/puppet";
import { getPuppetCounterAddressAndBump } from "../sdk/src/utils";
import { assert } from "chai";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { calculatePriceSqrt, Pair } from "@invariant-labs/sdk-eclipse";
import {
  fromFee,
  getTokenProgramAddress,
  LIQUIDITY_DENOMINATOR,
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

  let protocol: Protocol;
  let market: Market;
  let tokenX: PublicKey;
  let tokenY: PublicKey;
  const feeTier: FeeTier = {
    fee: fromFee(new BN(600)),
    tickSpacing: 10,
  };
  let pair: Pair;
  const lowerTick = -10;
  const upperTick = 10;
  const initTick = 0;

  before(async () => {
    await Promise.all([connection.requestAirdrop(owner.publicKey, 1e14)]);
    await Promise.all([connection.requestAirdrop(wallet.publicKey, 1e14)]);
    await Promise.all([
      connection.requestAirdrop(mintAuthority.publicKey, 1e14),
    ]);
    await Promise.all([connection.requestAirdrop(wallet.publicKey, 1e14)]);
    await Promise.all([
      connection.requestAirdrop(mintAuthority.publicKey, 1e14),
    ]);

    await sleep(1000);

    protocol = await Protocol.build(Network.LOCAL, walletAnchor, connection);

    market = await Market.build(
      Network.LOCAL,
      walletAnchor,
      connection,
      INVARIANT_ADDRESS
    );

    const tokens = await Promise.all([
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
    ]);
    tokenX = tokens[0];
    tokenY = tokens[1];
    pair = new Pair(tokenX, tokenY, feeTier);

    await initMarket(market, [pair], owner, initTick);
    await market.createPositionList(owner.publicKey, owner);

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

    const xOwnerAmount = 1e10;
    const yOwnerAmount = 1e10;

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

  it("invariant cpi update seconds per liquidity works", async () => {
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

  it("invariant cpi create position works", async () => {
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

    const { address: stateAddress } = await market.getStateAddress();
    const poolAddress = await pair.getAddress(INVARIANT_ADDRESS);
    const { positionListAddress: positionListAddress } =
      await market.getPositionListAddress(owner.publicKey);
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
    const { tokenXReserve, tokenYReserve, tickmap } = await market.getPool(
      pair
    );
    const tokenXProgram = await getTokenProgramAddress(connection, pair.tokenX);
    const tokenYProgram = await getTokenProgramAddress(connection, pair.tokenY);

    const lowerTick = -10;
    const upperTick = 10;
    const liquidityDelta = { v: LIQUIDITY_DENOMINATOR.muln(10_000) };
    const slippageLimitLower = { v: new BN(0) };
    const slippageLimitUpper = { v: new BN(2n ** 128n - 1n) };

    console.log(
      INVARIANT_ADDRESS.toString(),
      stateAddress.toString(),
      positionAddress.toString(),
      poolAddress.toString(),
      positionListAddress.toString(),
      owner.publicKey.toString(),
      owner.publicKey.toString(),
      lowerTickAddress.toString(),
      upperTickAddress.toString(),
      tickmap.toString(),
      tokenX.toString(),
      tokenY.toString(),
      userTokenXAccount.address.toString(),
      userTokenYAccount.address.toString(),
      tokenXReserve.toString(),
      tokenYReserve.toString(),
      market.programAuthority.toString(),
      tokenXProgram.toString(),
      tokenYProgram.toString()
    );
    await protocol.invokeCreatePosition(
      {
        invariantProgram: INVARIANT_ADDRESS,
        state: stateAddress,
        position: positionAddress,
        pool: poolAddress,
        positionList: positionListAddress,
        payer: owner.publicKey,
        owner: owner.publicKey,
        lowerTick: lowerTickAddress,
        upperTick: upperTickAddress,
        tickmap,
        tokenX,
        tokenY,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
        reserveX: tokenXReserve,
        reserveY: tokenYReserve,
        programAuthority: market.programAuthority,
        tokenXProgram,
        tokenYProgram,
      },
      lowerTick,
      upperTick,
      liquidityDelta,
      slippageLimitLower,
      slippageLimitUpper,
      owner
    );
  });
});
