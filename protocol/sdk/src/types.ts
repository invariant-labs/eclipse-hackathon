import { BN } from "@coral-xyz/anchor";
import { Pair } from "@invariant-labs/sdk-eclipse";
import { Decimal } from "@invariant-labs/sdk-eclipse/lib/market";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

export interface LpPoolStructure {
  invariantPosition: PublicKey;
  leftoverX: BN;
  leftoverY: BN;
  tokenX: PublicKey;
  tokenY: PublicKey;
  tickSpacing: number;
  fee: Decimal;
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
  // params
  index: number;
  liquidityDelta: BN;
  // invariant accounts
  invProgram: PublicKey;
  invState: PublicKey;
  pool?: PublicKey;
  position: PublicKey;
  lastPosition: PublicKey;
  positionList: PublicKey;
  lowerTick: PublicKey;
  upperTick: PublicKey;
  tickmap: PublicKey;
  accountX: PublicKey;
  accountY: PublicKey;
  invReserveX: PublicKey;
  invReserveY: PublicKey;
  invProgramAuthority: PublicKey;
  tokenXProgram?: PublicKey;
  tokenYProgram?: PublicKey;
}

export interface IBurnLpToken {
  // data
  pair: Pair;
  // params
  index: number;
  liquidityDelta: BN;
  // invariant accounts
  invProgram: PublicKey;
  invState: PublicKey;
  pool?: PublicKey;
  position: PublicKey;
  lastPosition: PublicKey;
  positionList: PublicKey;
  lowerTick: PublicKey;
  upperTick: PublicKey;
  tickmap: PublicKey;
  accountX: PublicKey;
  accountY: PublicKey;
  invReserveX: PublicKey;
  invReserveY: PublicKey;
  invProgramAuthority: PublicKey;
  tokenXProgram?: PublicKey;
  tokenYProgram?: PublicKey;
}