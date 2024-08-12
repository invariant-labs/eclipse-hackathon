import { TokenInstructions } from "@project-serum/serum";
import { createMint } from "@solana/spl-token";
import { Connection, PublicKey, Signer } from "@solana/web3.js";

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createMinter = async (
  connection: Connection,
  payer: Signer,
  mintAuthority: PublicKey,
  decimals
) => {
  const token = await createMint(
    connection,
    payer,
    mintAuthority,
    null,
    decimals,
    undefined,
    undefined,
    TokenInstructions.TOKEN_PROGRAM_ID
  );
  return token;
};
