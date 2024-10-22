import { AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  BlockheightBasedTransactionConfirmationStrategy,
  ComputeBudgetProgram,
  ConfirmOptions,
  Connection,
  Keypair,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";

export const signAndSend = async (
  tx: Transaction,
  signers: Keypair[],
  connection: Connection,
  opts?: ConfirmOptions
): Promise<TransactionSignature> => {
  tx.feePayer ??= signers[0].publicKey;
  const latestBlockhash = await connection.getLatestBlockhash(
    opts?.commitment ?? AnchorProvider.defaultOptions().commitment
  );
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.partialSign(...signers);
  const signature = await connection.sendRawTransaction(
    tx.serialize(),
    opts ?? AnchorProvider.defaultOptions()
  );

  const confirmStrategy: BlockheightBasedTransactionConfirmationStrategy = {
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    signature,
  };
  await connection.confirmTransaction(confirmStrategy);

  return signature;
};

export const computeUnitsInstruction = (
  units: number
): TransactionInstruction => {
  return ComputeBudgetProgram.setComputeUnitLimit({ units });
};

export const bigNumberToBuffer = (n: BN, size: 16 | 32 | 64 | 128 | 256) => {
  const chunk = new BN(2).pow(new BN(16));

  const buffer = Buffer.alloc(size / 8);
  let offset = 0;

  while (n.gt(new BN(0))) {
    buffer.writeUInt16LE(n.mod(chunk).toNumber(), offset);
    n = n.div(chunk);
    offset += 2;
  }

  return buffer;
};
