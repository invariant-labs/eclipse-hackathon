import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createTokenMint,
  initMarket,
  INVARIANT_ADDRESS,
  requestAirdrop,
} from "./test-utils";
import { assert } from "chai";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Pair } from "@invariant-labs/sdk-eclipse";
import {
  fromFee,
  getMaxTick,
  getMinTick,
} from "@invariant-labs/sdk-eclipse/lib/utils";
import {
  CreateTick,
  FeeTier,
  Market,
} from "@invariant-labs/sdk-eclipse/lib/market";

describe("burn lp token", () => {
  const { wallet: walletAnchor, connection } = AnchorProvider.local();
  const owner = Keypair.generate();
  const wallet = Keypair.generate();
  const mintAuthority = Keypair.generate();

  let protocol: Protocol;
  let market: Market;
  const feeTier: FeeTier = {
    fee: fromFee(new BN(600)),
    tickSpacing: 10,
  };
  let pair: Pair;
  const lowerTick = getMinTick(feeTier.tickSpacing ? feeTier.tickSpacing : 1);
  const upperTick = getMaxTick(feeTier.tickSpacing ? feeTier.tickSpacing : 1);
  const initTick = 0;

  before(async () => {
    let giveSOL = [owner.publicKey, mintAuthority.publicKey, wallet.publicKey];
    await Promise.all(
      giveSOL.map((account) => requestAirdrop(connection, account, 1e14))
    );

    market = await Market.build(
      Network.LOCAL,
      walletAnchor,
      connection,
      INVARIANT_ADDRESS
    );

    const [token0, token1] = await Promise.all([
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
    ]);
    pair = new Pair(token0, token1, feeTier);

    await initMarket(market, [pair], owner, initTick);

    protocol = await Protocol.build(Network.LOCAL, walletAnchor, connection);
    await protocol.init(owner, market);

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
      pair.tokenX,
      owner.publicKey
    );
    const userTokenYAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      pair.tokenY,
      owner.publicKey
    );

    await mintTo(
      connection,
      owner,
      pair.tokenX,
      userTokenXAccount.address,
      mintAuthority,
      xOwnerAmount
    );
    await mintTo(
      connection,
      owner,
      pair.tokenY,
      userTokenYAccount.address,
      mintAuthority,
      yOwnerAmount
    );
  });

  it("test", async () => {
    const userTokenXAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenX,
      owner.publicKey
    );
    const userTokenYAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenY,
      owner.publicKey
    );

    const positionId = 0;

    const liquidityDelta = new BN(50000000);

    const { positionAddress } = await market.getPositionAddress(
      protocol.programAuthority,
      positionId
    );

    await protocol.initLpPool(
      {
        pair,
      },
      owner
    );

    await protocol.mintLpToken(
      {
        pair,
        invariant: market,

        liquidityDelta,

        position: positionAddress,
        accountX: userTokenXAccountAddress,
        accountY: userTokenYAccountAddress,
      },
      owner
    );

    const protocolTokenXAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenX,
      protocol.programAuthority,
      true
    );
    const protocolTokenYAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenY,
      protocol.programAuthority,
      true
    );

    const getTokenAccount = async (tokenAccount: PublicKey) => {
      return await getAccount(connection, tokenAccount, undefined);
    };

    const position = await market.getPosition(
      protocol.programAuthority,
      positionId
    );
    console.log(position);
    assert.ok(position);

    const { positionAddress: lastPositionAddress2 } =
      await market.getPositionAddress(protocol.programAuthority, 0);

    const [tokenLp] = protocol.getLpTokenAddressAndBump(pair);
    const accountLpAddress = getAssociatedTokenAddressSync(
      tokenLp,
      owner.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    let accountLp = await getAccount(
      connection,
      accountLpAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    assert.equal(accountLp.amount, 23n);
    assert.equal(
      (await getTokenAccount(userTokenXAccountAddress)).amount,
      9999999950n
    );
    assert.equal(
      (await getTokenAccount(userTokenYAccountAddress)).amount,
      9999999950n
    );

    const positionCount = (
      await market.getPositionList(protocol.programAuthority)
    ).head;
    const lastPositionId = positionCount == 0 ? 0 : positionCount - 1;
    const lastPosition = await market.getPosition(
      protocol.programAuthority,
      lastPositionId
    );
    const lastPositionPool = await market.getPoolByAddress(lastPosition.pool);
    const [lastPositionLpPool] = protocol.getLpPoolAddressAndBump(
      new Pair(lastPositionPool.tokenX, lastPositionPool.tokenY, {
        fee: new BN(lastPositionPool.fee.v),
        tickSpacing: lastPositionPool.tickSpacing,
      })
    );

    console.log("burn 1");
    await protocol.burnLpToken(
      {
        pair,
        invariant: market,

        liquidityDelta: new BN(46000747),

        lastPositionLpPool,

        position: positionAddress,
        lastPosition: lastPositionAddress2,
        accountX: userTokenXAccountAddress,
        accountY: userTokenYAccountAddress,
      },
      owner
    );
    accountLp = await getAccount(
      connection,
      accountLpAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.equal(accountLp.amount, 1n);
    assert.equal(
      (await getTokenAccount(userTokenXAccountAddress)).amount,
      9999999996n
    );
    assert.equal(
      (await getTokenAccount(userTokenYAccountAddress)).amount,
      9999999996n
    );

    assert.equal(
      (await getTokenAccount(protocolTokenXAccountAddress)).amount,
      0n
    );
    assert.equal(
      (await getTokenAccount(protocolTokenYAccountAddress)).amount,
      0n
    );

    console.log("burn 2");
    const positionBeforeLastBurn = await market.getPosition(
      protocol.programAuthority,
      0
    );
    await protocol.burnLpToken(
      {
        pair,
        invariant: market,

        liquidityDelta: positionBeforeLastBurn.liquidity.v,

        lastPositionLpPool,

        position: positionAddress,
        lastPosition: lastPositionAddress2,
        accountX: userTokenXAccountAddress,
        accountY: userTokenYAccountAddress,
      },
      owner
    );

    assert.equal(
      (await getTokenAccount(userTokenXAccountAddress)).amount,
      9999999999n
    );
    assert.equal(
      (await getTokenAccount(userTokenYAccountAddress)).amount,
      9999999999n
    );
    assert.equal(
      (await getTokenAccount(protocolTokenXAccountAddress)).amount,
      0n
    );
    assert.equal(
      (await getTokenAccount(protocolTokenYAccountAddress)).amount,
      0n
    );
    let err = false;
    try {
      const positionAfterBurn = await market.getPosition(
        protocol.programAuthority,
        positionId
      );
      console.log(positionAfterBurn);
    } catch (e) {
      err = true;
    }
    assert(err, "burn did not remove position");
    const lpPool = await protocol.getLpPool(pair);
    accountLp = await getAccount(
      connection,
      accountLpAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
    assert.equal(accountLp.amount, 0n);
    assert.equal(lpPool.leftoverX, 0n);
    assert.equal(lpPool.leftoverX, 0n);
  });
});
