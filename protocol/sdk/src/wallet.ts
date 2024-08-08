import { PublicKey, Transaction } from "@solana/web3.js";

export interface IWallet {
  signTransaction: (tx: Transaction) => Promise<Transaction>;
  signAllTransactions: (txs: Transaction[]) => Promise<Transaction[]>;
  publicKey: PublicKey;
}
