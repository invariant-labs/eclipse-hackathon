import { AnchorProvider, utils } from "@coral-xyz/anchor";
import {
  ConfirmOptions,
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
} from "@solana/web3.js";
import { PROTOCOL_STATE_SEED, PUPPET_COUNTER_SEED } from "./consts";

export const signAndSend = async (
  tx: Transaction,
  signers: Keypair[],
  connection: Connection,
  opts?: ConfirmOptions
) => {
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

export const getProtocolStateAddressAndBump = async (
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode(PROTOCOL_STATE_SEED))],
    programId
  );
};

export const getProtocolStateAddress = async (
  programId: PublicKey
): Promise<PublicKey> => {
  return (await getProtocolStateAddressAndBump(programId))[0];
};

export const getPuppetCounterAddressAndBump = async (
  programId: PublicKey
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [Buffer.from(utils.bytes.utf8.encode(PUPPET_COUNTER_SEED))],
    programId
  );
};

export const getPuppetCounterAddress = async (
  programId: PublicKey
): Promise<PublicKey> => {
  return (await getPuppetCounterAddressAndBump(programId))[0];
};
