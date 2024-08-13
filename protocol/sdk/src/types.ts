import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

export interface ITransaction {
  tx: Transaction;
  signers?: Keypair[];
}

export interface TestAccounts {
  puppetProgram: PublicKey;
  counter: PublicKey;
}

export interface InvokeUpdateSecondsPerLiquidityAccounts {
  invariantProgram: PublicKey;
  pool: PublicKey;
  lowerTick: PublicKey;
  upperTick: PublicKey;
  position: PublicKey;
  tokenX: PublicKey;
  tokenY: PublicKey;
  owner: PublicKey;
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
