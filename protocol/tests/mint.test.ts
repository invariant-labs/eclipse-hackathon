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
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccount,
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

describe("mint lp token", () => {
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
  const lowerTick = getMinTick(feeTier.tickSpacing ? feeTier.tickSpacing : 0);
  const upperTick = getMaxTick(feeTier.tickSpacing ? feeTier.tickSpacing : 0);
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
    await protocol.initWithPositionlist(owner, market);

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

    // TODO: make it support cases where the id is different from 0 -> multiple positions for user aka multiple LP pools
    const positionId = 0;
    const lastPositionId = 0;

    const liquidityDelta = new BN(500000000);

    const { address: stateAddress } = await market.getStateAddress();
    const poolAddress = await pair.getAddress(INVARIANT_ADDRESS);
    const { positionListAddress: positionListAddress } =
      await market.getPositionListAddress(protocol.programAuthority);
    const { positionAddress } = await market.getPositionAddress(
      protocol.programAuthority,
      positionId
    );
    const { positionAddress: lastPositionAddress } =
      await market.getPositionAddress(
        protocol.programAuthority,
        lastPositionId
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

    await protocol.initLpPool(
      {
        pair,
      },
      owner
    );

    const [tokenLp] = protocol.getLpTokenAddressAndBump(pair);
    // getorCreate has the advantage since you can call it several times with no downsides
    const accountLp = await createAssociatedTokenAccount(
      connection,
      owner,
      tokenLp,
      owner.publicKey,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    await protocol.mintLpToken(
      {
        liquidityDelta,
        pair,
        index: positionId,
        invProgram: INVARIANT_ADDRESS,
        invState: stateAddress,
        position: positionAddress,
        lastPosition: lastPositionAddress,
        pool: poolAddress,
        positionList: positionListAddress,
        lowerTick: lowerTickAddress,
        upperTick: upperTickAddress,
        tickmap,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
        invReserveX: tokenXReserve,
        invReserveY: tokenYReserve,
        invProgramAuthority: market.programAuthority,
      },
      owner
    );

    console.log("mint 2");

    await protocol.mintLpToken(
      {
        liquidityDelta,
        pair,
        index: positionId,
        invProgram: INVARIANT_ADDRESS,
        invState: stateAddress,
        position: positionAddress,
        lastPosition: lastPositionAddress,
        pool: poolAddress,
        positionList: positionListAddress,
        lowerTick: lowerTickAddress,
        upperTick: upperTickAddress,
        tickmap,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
        invReserveX: tokenXReserve,
        invReserveY: tokenYReserve,
        invProgramAuthority: market.programAuthority,
      },
      owner
    );

    console.log("mint 3");

    await protocol.mintLpToken(
      {
        liquidityDelta,
        pair,
        index: positionId,
        invProgram: INVARIANT_ADDRESS,
        invState: stateAddress,
        position: positionAddress,
        lastPosition: lastPositionAddress,
        pool: poolAddress,
        positionList: positionListAddress,
        lowerTick: lowerTickAddress,
        upperTick: upperTickAddress,
        tickmap,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
        invReserveX: tokenXReserve,
        invReserveY: tokenYReserve,
        invProgramAuthority: market.programAuthority,
      },
      owner
    );

    console.log("mint 4");

    await protocol.mintLpToken(
      {
        liquidityDelta,
        pair,
        index: positionId,
        invProgram: INVARIANT_ADDRESS,
        invState: stateAddress,
        position: positionAddress,
        lastPosition: lastPositionAddress,
        pool: poolAddress,
        positionList: positionListAddress,
        lowerTick: lowerTickAddress,
        upperTick: upperTickAddress,
        tickmap,
        accountX: userTokenXAccount.address,
        accountY: userTokenYAccount.address,
        invReserveX: tokenXReserve,
        invReserveY: tokenYReserve,
        invProgramAuthority: market.programAuthority,
      },
      owner
    );

    const position = await market.getPosition(
      protocol.programAuthority,
      positionId
    );
    console.log(position);
    assert.ok(position);
  });
});
