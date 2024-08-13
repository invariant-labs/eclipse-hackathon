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
import {
  PROTOCOL_AUTHORITY_SEED,
  PROTOCOL_STATE_SEED,
  PUPPET_COUNTER_SEED,
} from "./consts";

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

export const getProgramAuthorityAddressAndBump = (
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(utils.bytes.utf8.encode(PROTOCOL_AUTHORITY_SEED))],
    programId
  );
};

export const getProtocolStateAddressAndBump = (
  programId: PublicKey
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(utils.bytes.utf8.encode(PROTOCOL_STATE_SEED))],
    programId
  );
};

export const getProtocolStateAddress = (programId: PublicKey): PublicKey => {
  return getProtocolStateAddressAndBump(programId)[0];
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
