import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair } from "@solana/web3.js";
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
import { lpTokenAmountToLiquidity } from "../sdk/src";

describe("multiple pools", () => {
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

  let pair01: Pair;
  let pair02: Pair;
  let pair12: Pair;
  const lowerTick = getMinTick(feeTier.tickSpacing ?? 0);
  const upperTick = getMaxTick(feeTier.tickSpacing ?? 0);
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

    const [token0, token1, token2] = await Promise.all([
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
      createTokenMint(connection, owner, mintAuthority.publicKey, 6),
    ]);
    pair01 = new Pair(token0, token1, feeTier);
    pair02 = new Pair(token0, token2, feeTier);
    pair12 = new Pair(token1, token2, feeTier);
    let pairs = [pair01, pair02, pair12];

    await initMarket(market, pairs, owner, initTick);

    protocol = await Protocol.build(Network.LOCAL, walletAnchor, connection);
    await protocol.init(owner, market);

    for (const pair of pairs) {
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
    }

    const ownerAmount = 1e10;

    const userTokenXAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      token0,
      owner.publicKey
    );
    const userTokenYAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      token1,
      owner.publicKey
    );
    const userTokenZAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      token2,
      owner.publicKey
    );

    await mintTo(
      connection,
      owner,
      token0,
      userTokenXAccount.address,
      mintAuthority,
      ownerAmount
    );
    await mintTo(
      connection,
      owner,
      token1,
      userTokenYAccount.address,
      mintAuthority,
      ownerAmount
    );
    await mintTo(
      connection,
      owner,
      token2,
      userTokenZAccount.address,
      mintAuthority,
      ownerAmount
    );
  });

  it("mint multiple [pair 01]:[position 0]", async () => {
    let pair = pair01;
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

    const positionCount = (
      await market.getPositionList(protocol.programAuthority)
    ).head;

    // if the LPPool is going to be created, the positionId is the next uninitialized position
    const newPositionId = positionCount;

    const liquidityDelta = new BN(500000000);

    const { positionAddress } = await market.getPositionAddress(
      protocol.programAuthority,
      newPositionId
    );

    await protocol.initLpPool(
      {
        pair,
      },
      owner
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        invariant: market,
        pair,
        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        invariant: market,
        pair,
        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    const position = await market.getPosition(
      protocol.programAuthority,
      newPositionId
    );
    assert.ok(position);
  });

  // pair02
  it("mint multiple [pair 02]:[position 1]", async () => {
    const pair = pair02;
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

    const positionCount = (
      await market.getPositionList(protocol.programAuthority)
    ).head;
    // if the LPPool is going to be created, the positionId is the next uninitialized position
    const positionId = positionCount;

    const liquidityDelta = new BN(500000000);

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
        liquidityDelta,
        pair,
        invariant: market,

        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        pair,
        invariant: market,

        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        pair,
        invariant: market,

        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        pair,
        invariant: market,

        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    const position = await market.getPosition(
      protocol.programAuthority,
      positionId
    );
    assert.ok(position);
  });

  it("mint multiple [pair 12]:[position 2]", async () => {
    const pair = pair12;
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

    const positionCount = (
      await market.getPositionList(protocol.programAuthority)
    ).head;
    // if the LPPool is going to be created, the positionId is the next uninitialized position
    const positionId = positionCount;

    const liquidityDelta = new BN(500000000);

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
        liquidityDelta,
        pair,
        invariant: market,

        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        pair,
        invariant: market,

        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    const position = await market.getPosition(
      protocol.programAuthority,
      positionId
    );
    assert.ok(position);
  });

  it("burn all [pair 01]:[position 0]", async () => {
    const pair = pair01;

    const userTokenXAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenX,
      owner.publicKey
    );
    const userTokenYAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenY,
      owner.publicKey
    );

    const positionId = 0;
    const { positionAddress } = await market.getPositionAddress(
      protocol.programAuthority,
      positionId
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

    const { positionAddress: lastPositionAddress } =
      await market.getPositionAddress(
        protocol.programAuthority,
        lastPositionId
      );

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
        lastPosition: lastPositionAddress,
        accountX: userTokenXAccountAddress,
        accountY: userTokenYAccountAddress,
      },
      owner
    );

    const lpPool = await protocol.getLpPool(pair);
    assert.notOk(lpPool.positionExists);

    let err = false;
    try {
      await market.getPosition(protocol.programAuthority, 2);
    } catch (e) {
      err = true;
    }
    assert(err, "burn did not remove position 2");

    const newFirstPosition = await market.getPosition(
      protocol.programAuthority,
      0
    );
    const newFirstPositionPool = await market.getPoolByAddress(
      newFirstPosition.pool
    );
    const newFirstPositionLpPool = await protocol.getLpPool(
      new Pair(newFirstPositionPool.tokenX, newFirstPositionPool.tokenY, {
        fee: new BN(newFirstPositionPool.fee.v),
        tickSpacing: newFirstPositionPool.tickSpacing,
      })
    );
    assert(newFirstPositionLpPool.tokenX.equals(pair12.tokenX));
    assert(newFirstPositionLpPool.tokenY.equals(pair12.tokenY));
  });

  it("burn all [pair 02]:[position 1]", async () => {
    const pair = pair02;

    const userTokenXAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenX,
      owner.publicKey
    );
    const userTokenYAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenY,
      owner.publicKey
    );

    const positionId = 1;
    const { positionAddress } = await market.getPositionAddress(
      protocol.programAuthority,
      positionId
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

    const { positionAddress: lastPositionAddress } =
      await market.getPositionAddress(
        protocol.programAuthority,
        lastPositionId
      );

    const positionBeforeLastBurn = await market.getPosition(
      protocol.programAuthority,
      1
    );
    await protocol.burnLpToken(
      {
        pair,
        invariant: market,

        liquidityDelta: positionBeforeLastBurn.liquidity.v,

        lastPositionLpPool,

        position: positionAddress,
        lastPosition: lastPositionAddress,
        accountX: userTokenXAccountAddress,
        accountY: userTokenYAccountAddress,
      },
      owner
    );

    const lpPool = await protocol.getLpPool(pair);
    assert.notOk(lpPool.positionExists);

    let err = false;
    try {
      await market.getPosition(protocol.programAuthority, 1);
    } catch (e) {
      err = true;
    }
    assert(err, "burn did not remove position 1");

    const newFirstPositionLpPool = await protocol.getLpPool(pair);
    assert.notOk(newFirstPositionLpPool.positionExists);
  });

  it("mint multiple [pair 01]:[position 1]", async () => {
    let pair = pair01;

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
      pair.tokenX,
      owner.publicKey
    );
    const userTokenYAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      owner,
      pair.tokenY,
      owner.publicKey
    );

    const positionCount = (
      await market.getPositionList(protocol.programAuthority)
    ).head;

    // if the LPPool is going to be created, the positionId is the next uninitialized position
    const newPositionId = positionCount;

    const liquidityDelta = new BN(500000000);

    const { positionAddress } = await market.getPositionAddress(
      protocol.programAuthority,
      newPositionId
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        invariant: market,
        pair,
        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        invariant: market,
        pair,
        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    const position = await market.getPosition(
      protocol.programAuthority,
      newPositionId
    );
    assert.ok(position);
  });

  it("burn half [pair 01]:[position 1]", async () => {
    const pair = pair01;

    const userTokenXAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenX,
      owner.publicKey
    );
    const userTokenYAccountAddress = getAssociatedTokenAddressSync(
      pair.tokenY,
      owner.publicKey
    );

    const positionId = 1;
    const { positionAddress } = await market.getPositionAddress(
      protocol.programAuthority,
      positionId
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

    const { positionAddress: lastPositionAddress } =
      await market.getPositionAddress(
        protocol.programAuthority,
        lastPositionId
      );

    const positionBeforeLastBurn = await market.getPosition(
      protocol.programAuthority,
      1
    );
    await protocol.burnLpToken(
      {
        pair,
        invariant: market,

        liquidityDelta: positionBeforeLastBurn.liquidity.v.div(new BN(2)),

        lastPositionLpPool,

        position: positionAddress,
        lastPosition: lastPositionAddress,
        accountX: userTokenXAccountAddress,
        accountY: userTokenYAccountAddress,
      },
      owner
    );

    const lpPool = await protocol.getLpPool(pair);
    assert.ok(lpPool.positionExists);

    await market.getPosition(protocol.programAuthority, 1);

    const newFirstPositionLpPool = await protocol.getLpPool(pair);
    assert.ok(newFirstPositionLpPool.positionExists);
  });

  it("mint one LpToken [pair 12]:[position 0]", async () => {
    const pair = pair12;

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

    const positionId = 0;
    let position = await market.getPosition(
      protocol.programAuthority,
      positionId
    );

    const [tokenLp] = protocol.getLpTokenAddressAndBump(pair);
    const accountLpAddress = getAssociatedTokenAddressSync(
      tokenLp,
      owner.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const accountLp = await getAccount(
      connection,
      accountLpAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    const supplyBefore = accountLp.amount;

    const liquidityDelta = lpTokenAmountToLiquidity(
      { v: new BN(accountLp.amount) },
      position.liquidity,
      { v: new BN(1) },
      true
    );

    const { positionAddress } = await market.getPositionAddress(
      protocol.programAuthority,
      positionId
    );

    await protocol.mintLpToken(
      {
        liquidityDelta: liquidityDelta.v,
        pair,
        invariant: market,

        position: positionAddress,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
      },
      owner
    );

    position = await market.getPosition(protocol.programAuthority, positionId);
    assert.ok(position);

    const supply = (
      await getAccount(
        connection,
        accountLpAddress,
        undefined,
        TOKEN_2022_PROGRAM_ID
      )
    ).amount;
    assert.equal(supply, supplyBefore + 1n);
  });
});
