import { Keypair, PublicKey, Transaction } from "@solana/web3.js";

export interface ITransaction {
  tx: Transaction;
  signers?: Keypair[];
}

export interface TestAccounts {
  puppetProgram: PublicKey;
  counter: PublicKey;
}
