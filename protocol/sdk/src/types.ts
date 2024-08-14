import { BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

export interface ITransaction {
  tx: Transaction;
  signers?: Keypair[];
}

export interface IInit {
  admin?: PublicKey;
}

export interface ITest {
  payer?: PublicKey;
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
  owner: PublicKey;
}

export interface IWithdraw {
  tokenMint: PublicKey;
  reserve: PublicKey;
  userBalance: PublicKey;
  amount: BN;
  owner: PublicKey;
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
  owner: PublicKey;
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
  payer: PublicKey;
  owner: PublicKey;
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
  owner: PublicKey;
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
