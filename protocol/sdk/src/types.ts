import { BN } from "@coral-xyz/anchor";
import { Pair } from "@invariant-labs/sdk-eclipse";
import {
  Decimal,
  Market,
  PoolStructure,
} from "@invariant-labs/sdk-eclipse/lib/market";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

export interface LpPoolStructure {
  positionIndex: number;
  positionExists: boolean;
  leftoverX: BN;
  leftoverY: BN;
  tokenX: PublicKey;
  tokenY: PublicKey;
  tickSpacing: number;
  fee: Decimal;
  tokenBump: number;
  bump: number;
}

export interface ITransaction {
  tx: Transaction;
  signers?: Keypair[];
}

export interface IInitLpPool {
  pair: Pair;
  pool?: PublicKey;
  tokenXProgram?: PublicKey;
  tokenYProgram?: PublicKey;
}

export interface IMintLpToken {
  // data
  pair: Pair;
  invariant: Market;
  poolStructure?: PoolStructure;
  // params
  liquidityDelta: BN;
  // invariant accounts
  position: PublicKey;
  accountX: PublicKey;
  accountY: PublicKey;
  tokenXProgram?: PublicKey;
  tokenYProgram?: PublicKey;
}

export interface IBurnLpToken {
  // data
  pair: Pair;
  invariant: Market;
  poolStructure?: PoolStructure;
  // params
  liquidityDelta: BN;
  // fullrange accounts
  lastPositionLpPool: PublicKey;
  // invariant accounts
  position: PublicKey;
  lastPosition: PublicKey;
  accountX: PublicKey;
  accountY: PublicKey;
  tokenXProgram?: PublicKey;
  tokenYProgram?: PublicKey;
}
