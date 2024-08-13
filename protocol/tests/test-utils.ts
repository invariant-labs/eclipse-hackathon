import { Connection, Keypair, PublicKey, Signer } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import { TokenInstructions } from "@project-serum/serum";
import { assert } from "chai";
import {
  CreateFeeTier,
  CreatePool,
} from "@invariant-labs/sdk-eclipse/lib/market";
import {
  calculatePriceSqrt,
  Market,
  Pair,
  TICK_LIMIT,
} from "@invariant-labs/sdk-eclipse";

export const INVARIANT_ADDRESS = new PublicKey(
  "CsT21LCRqBfh4SCcNZXtWjRZ6xvYKvdpEBaytCVmWnVJ"
);

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createTokenMint = async (
  connection: Connection,
  payer: Signer,
  mintAuthority: PublicKey,
  decimals: number
) => {
  const token = await createMint(
    connection,
    payer,
    mintAuthority,
    null,
    decimals,
    undefined,
    undefined,
    TokenInstructions.TOKEN_PROGRAM_ID
  );
  return token;
};

export const createToken = async (
  connection: Connection,
  payer: Keypair,
  mintAuthority: Keypair,
  decimals = 6
) => {
  const token = await createMint(
    connection,
    payer,
    mintAuthority.publicKey,
    null,
    decimals
  );
  return token;
};

export const initMarket = async (
  market: Market,
  pairs: Pair[],
  admin: Keypair,
  initTick?: number
) => {
  try {
    await market.createState(admin.publicKey, admin);
  } catch (e) {
    console.log(e);
  }

  const state = await market.getState();
  const { bump } = await market.getStateAddress();
  const { programAuthority, nonce } = await market.getProgramAuthority();
  assert.ok(state.admin.equals(admin.publicKey));
  assert.ok(state.authority.equals(programAuthority));
  assert.ok(state.nonce === nonce);
  assert.ok(state.bump === bump);

  for (const pair of pairs) {
    try {
      await market.getFeeTier(pair.feeTier);
    } catch (e) {
      const createFeeTierVars: CreateFeeTier = {
        feeTier: pair.feeTier,
        admin: admin.publicKey,
      };
      await market.createFeeTier(createFeeTierVars, admin);
    }

    const createPoolVars: CreatePool = {
      pair,
      payer: admin,
      initTick: initTick,
    };
    await market.createPool(createPoolVars);

    const createdPool = await market.getPool(pair);
    assert.ok(createdPool.tokenX.equals(pair.tokenX));
    assert.ok(createdPool.tokenY.equals(pair.tokenY));
    assert.ok(createdPool.fee.v.eq(pair.feeTier.fee));
    assert.equal(createdPool.tickSpacing, pair.feeTier.tickSpacing);
    assert.ok(createdPool.liquidity.v.eqn(0));
    assert.ok(createdPool.sqrtPrice.v.eq(calculatePriceSqrt(initTick ?? 0).v));
    assert.ok(createdPool.currentTickIndex === (initTick ?? 0));
    assert.ok(createdPool.feeGrowthGlobalX.v.eqn(0));
    assert.ok(createdPool.feeGrowthGlobalY.v.eqn(0));
    assert.ok(createdPool.feeProtocolTokenX.eqn(0));
    assert.ok(createdPool.feeProtocolTokenY.eqn(0));

    const tickmapData = await market.getTickmap(pair);
    assert.ok(tickmapData.bitmap.length === TICK_LIMIT / 4);
    assert.ok(tickmapData.bitmap.every((v) => v === 0));
  }
};
