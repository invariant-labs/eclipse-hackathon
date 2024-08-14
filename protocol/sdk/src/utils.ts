import { AnchorProvider, utils } from "@coral-xyz/anchor";
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";
import { PUPPET_COUNTER_SEED } from "./consts";

export const signAndSend = async (
  tx: Transaction,
  signers: Keypair[],
  connection: Connection,
  opts?: ConfirmOptions
): Promise<TransactionSignature> => {
  tx.setSigners(...signers.map((s) => s.publicKey));
  const blockhash = await connection.getRecentBlockhash(
    opts?.commitment ?? AnchorProvider.defaultOptions().commitment
  );
  tx.recentBlockhash = blockhash.blockhash;
  tx.partialSign(...signers);
  const rawTx = tx.serialize();
  return await sendAndConfirmRawTransaction(
    connection,
    rawTx,
    opts ?? AnchorProvider.defaultOptions()
  );
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
