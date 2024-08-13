import { BN } from "@coral-xyz/anchor";
import { Decimal } from "@invariant-labs/sdk-eclipse/lib/market";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

export interface ITransaction {
  tx: Transaction;
  signers?: Keypair[];
}

export interface InitParams {
  signer: Keypair;
}

export interface TestParams {
  puppetProgram: PublicKey;
  counter: PublicKey;
  stateBump: number;
  signer: Keypair;
}

export interface MintParams {
  amount: BN;
  tokenMint: PublicKey;
  to: PublicKey;
  signer: Keypair;
}

export interface DepositParams {
  tokenMint: PublicKey;
  reserve: PublicKey;
  userBalance: PublicKey;
  amount: BN;
  payer: Keypair;
}

export interface WithdrawParams {
  tokenMint: PublicKey;
  reserve: PublicKey;
  userBalance: PublicKey;
  amount: BN;
  payer: Keypair;
}

export interface InvokeUpdateSecondsPerLiquidityParams {
  lowerTickIndex: number;
  upperTickIndex: number;
  index: number;
  signer: Keypair;
  invariantProgram: PublicKey;
  pool: PublicKey;
  lowerTick: PublicKey;
  upperTick: PublicKey;
  position: PublicKey;
  tokenX: PublicKey;
  tokenY: PublicKey;
  owner: PublicKey;
}

export interface InvokeCreatePositionParams {
  lowerTickIndex: number;
  upperTickIndex: number;
  liquidityDelta: BN;
  slippageLimitLower: BN;
  slippageLimitUpper: BN;
  signer: Keypair;
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

export interface invokeCreatePosition {
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

export interface invokeCreatePosition {
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

export interface InvokeClosePositionParams {
  index: number;
  lowerTickIndex: number;
  upperTickIndex: number;
  signer: Keypair;
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

export interface InvokeClosePositionAccounts {
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
