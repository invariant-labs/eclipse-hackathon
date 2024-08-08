import { Keypair, Transaction } from "@solana/web3.js";

export interface ITransaction {
  tx: Transaction;
  signers?: Keypair[];
}
