import { AnchorProvider, utils } from "@coral-xyz/anchor";
import {
  BlockheightBasedTransactionConfirmationStrategy,
  ComputeBudgetProgram,
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import { PUPPET_COUNTER_SEED } from "./consts";

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

export const getPuppetCounterAddressAndBump = (
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(utils.bytes.utf8.encode(PUPPET_COUNTER_SEED))],
    programId
  );
};

export const getPuppetCounterAddress = (programId: PublicKey): PublicKey => {
  return getPuppetCounterAddressAndBump(programId)[0];
};
