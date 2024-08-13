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

describe("invariant cpi", () => {
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
  const lowerTick = -10;
  const upperTick = 10;
  const initTick = 0;

  before(async () => {
    let giveSOL = [owner.publicKey, mintAuthority.publicKey, wallet.publicKey];
    await Promise.all(
      giveSOL.map((account) => connection.requestAirdrop(account, 1e14))
    );
    await sleep(1000);

    protocol = await Protocol.build(Network.LOCAL, walletAnchor, connection);

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

  it("update seconds per liquidity", async () => {
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

    await protocol.invokeUpdateSecondsPerLiquidity({
      lowerTickIndex: lowerTick,
      upperTickIndex: upperTick,
      index: initTick,
      signer: owner,
      invariantProgram: INVARIANT_ADDRESS,
      pool: poolAddress,
      lowerTick: lowerTickAddress,
      upperTick: upperTickAddress,
      position: positionAddress,
      tokenX: pair.tokenX,
      tokenY: pair.tokenY,
      owner: owner.publicKey,
    });

    const positionAfter = await market.getPosition(owner.publicKey, 0);
    assert.ok(
      positionAfter.secondsPerLiquidityInside.v.gt(
        positionBefore.secondsPerLiquidityInside.v
      )
    );
  });

  it("create position", async () => {
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

    const positionId = 1;

    const { address: stateAddress } = await market.getStateAddress();
    const poolAddress = await pair.getAddress(INVARIANT_ADDRESS);
    const { positionListAddress: positionListAddress } =
      await market.getPositionListAddress(owner.publicKey);
    const { positionAddress } = await market.getPositionAddress(
      owner.publicKey,
      positionId
    );
    const { tickAddress: lowerTickAddress } = await market.getTickAddress(
      pair,
      lowerTick
    );
    const { tickAddress: upperTickAddress } = await market.getTickAddress(
      pair,
      upperTick
    );
    const { tokenXReserve, tokenYReserve, tickmap } = await market.getPool(
      pair
    );
    const tokenXProgram = await getTokenProgramAddress(connection, pair.tokenX);
    const tokenYProgram = await getTokenProgramAddress(connection, pair.tokenY);

    const liquidityDelta = LIQUIDITY_DENOMINATOR.muln(10_000);
    const slippageLimitLower = new BN(0);
    const slippageLimitUpper = new BN(2n ** 128n - 1n);

    await protocol.invokeCreatePosition({
      lowerTickIndex: lowerTick,
      upperTickIndex: upperTick,
      liquidityDelta,
      slippageLimitLower,
      slippageLimitUpper,
      signer: owner,
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
      tokenX: pair.tokenX,
      tokenY: pair.tokenY,
      accountX: userTokenXAccount.address,
      accountY: userTokenYAccount.address,
      reserveX: tokenXReserve,
      reserveY: tokenYReserve,
      programAuthority: market.programAuthority,
      tokenXProgram,
      tokenYProgram,
    });

    const position = await market.getPosition(owner.publicKey, positionId);
    assert.ok(position);
  });

  it("close position", async () => {
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
    const lastPositionId = 1;

    const { address: stateAddress } = await market.getStateAddress();
    const poolAddress = await pair.getAddress(INVARIANT_ADDRESS);
    const { positionListAddress: positionListAddress } =
      await market.getPositionListAddress(owner.publicKey);
    const { positionAddress } = await market.getPositionAddress(
      owner.publicKey,
      positionId
    );
    const { positionAddress: lastPositionAddress } =
      await market.getPositionAddress(owner.publicKey, lastPositionId);
    const { tickAddress: lowerTickAddress } = await market.getTickAddress(
      pair,
      lowerTick
    );
    const { tickAddress: upperTickAddress } = await market.getTickAddress(
      pair,
      upperTick
    );
    const { tokenXReserve, tokenYReserve, tickmap } = await market.getPool(
      pair
    );
    const tokenXProgram = await getTokenProgramAddress(connection, pair.tokenX);
    const tokenYProgram = await getTokenProgramAddress(connection, pair.tokenY);

    await protocol.invokeClosePosition({
      index: positionId,
      lowerTickIndex: lowerTick,
      upperTickIndex: upperTick,
      signer: owner,
      invariantProgram: INVARIANT_ADDRESS,
      invariantState: stateAddress,
      removedPosition: positionAddress,
      lastPosition: lastPositionAddress,
      pool: poolAddress,
      positionList: positionListAddress,
      owner: owner.publicKey,
      lowerTick: lowerTickAddress,
      upperTick: upperTickAddress,
      tickmap,
      tokenX: pair.tokenX,
      tokenY: pair.tokenY,
      accountX: userTokenXAccount.address,
      accountY: userTokenYAccount.address,
      reserveX: tokenXReserve,
      reserveY: tokenYReserve,
      invariantProgramAuthority: market.programAuthority,
      tokenXProgram,
      tokenYProgram,
    });

    const position = await market.getPosition(owner.publicKey, positionId);
    assert.ok(position);
  });
});
