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

export interface ITest {
  puppetProgram: PublicKey;
  counter: PublicKey;
  stateBump: number;
}

export interface IMint {
  amount: BN;
  tokenMint: PublicKey;
  to: PublicKey;
}

export interface IDeposit {
  tokenMint: PublicKey;
  reserve: PublicKey;
  userBalance: PublicKey;
  amount: BN;
}

export interface IWithdraw {
  tokenMint: PublicKey;
  reserve: PublicKey;
  userBalance: PublicKey;
  amount: BN;
}

export interface IInvokeUpdateSecondsPerLiquidity {
  lowerTickIndex: number;
  upperTickIndex: number;
  index: number;
  invariantProgram: PublicKey;
  pool: PublicKey;
  lowerTick: PublicKey;
  upperTick: PublicKey;
  position: PublicKey;
  tokenX: PublicKey;
  tokenY: PublicKey;
}

export interface IInvokeCreatePosition {
  lowerTickIndex: number;
  upperTickIndex: number;
  liquidityDelta: BN;
  slippageLimitLower: BN;
  slippageLimitUpper: BN;
  invariantProgram: PublicKey;
  state: PublicKey;
  position: PublicKey;
  pool: PublicKey;
  positionList: PublicKey;
  lowerTick: PublicKey;
  upperTick: PublicKey;
  tickmap: PublicKey;
  tokenX: PublicKey;
  tokenY: PublicKey;
  accountX: PublicKey;
  accountY: PublicKey;
  reserveX: PublicKey;
  reserveY: PublicKey;
  programAuthority: PublicKey;
  tokenXProgram: PublicKey;
  tokenYProgram: PublicKey;
}

export interface IInvokeClosePosition {
  index: number;
  lowerTickIndex: number;
  upperTickIndex: number;
  invariantState: PublicKey;
  invariantProgramAuthority: PublicKey;
  removedPosition: PublicKey;
  positionList: PublicKey;
  lastPosition: PublicKey;
  pool: PublicKey;
  tickmap: PublicKey;
  lowerTick: PublicKey;
  upperTick: PublicKey;
  tokenX: PublicKey;
  tokenY: PublicKey;
  accountX: PublicKey;
  accountY: PublicKey;
  reserveX: PublicKey;
  reserveY: PublicKey;
  tokenXProgram: PublicKey;
  tokenYProgram: PublicKey;
  invariantProgram: PublicKey;
}

export interface IReopenPosition {
  // params
  index: number;
  // accounts
  invariantProgram: PublicKey;
  invariantState: PublicKey;
  position: PublicKey;
  lastPosition: PublicKey;
  pool: PublicKey;
  positionList: PublicKey;
  lowerTick: PublicKey;
  upperTick: PublicKey;
  tickmap: PublicKey;
  tokenX: PublicKey;
  tokenY: PublicKey;
  accountX: PublicKey;
  accountY: PublicKey;
  reserveX: PublicKey;
  reserveY: PublicKey;
  invariantProgramAuthority: PublicKey;
  tokenXProgram: PublicKey;
  tokenYProgram: PublicKey;
}

export interface IInitLpPool {
  pair: Pair;
  pool?: PublicKey;
  tokenXProgram?: PublicKey;
  tokenYProgram?: PublicKey;
}
