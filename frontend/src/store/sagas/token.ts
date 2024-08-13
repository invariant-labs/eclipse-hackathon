import {
  Connection,
  Keypair,
  PublicKey,
  sendAndConfirmTransaction,
  Signer,
  Transaction
} from '@solana/web3.js'
import { createMint, getMint, mintTo, getOrCreateAssociatedTokenAccount } from '@solana/spl-token'

import { call, SagaGenerator } from 'typed-redux-saga'
import { getConnection } from './connection'
import { getWallet } from './wallet'
import airdropAdmin from '@store/consts/airdropAdmin'

export function* createToken(
  decimals: number,
  freezeAuthority?: string,
  mintAuthority?: string
): SagaGenerator<string> {
  const wallet = yield* call(getWallet)
  const connection: Connection = yield* call(getConnection)

  const mint = yield* call(
    createMint,
    connection,
    airdropAdmin as Signer,
    mintAuthority ? new PublicKey(mintAuthority) : wallet.publicKey,
    freezeAuthority ? new PublicKey(freezeAuthority) : null,
    decimals
  )

  return mint.toBase58()
}

export function* getTokenDetails(address: string): SagaGenerator<any> {
  const connection: Connection = yield* call(getConnection)
  const mintInfo = yield* call(getMint, connection, new PublicKey(address))
  return mintInfo
}

// export function* mintToken(
//   tokenAddress: string,
//   recipient: string,
//   amount: number
// ): SagaGenerator<string> {
//   const wallet = yield* call(getWallet)
//   const connection: Connection = yield* call(getConnection)
//   const mintPublicKey = new PublicKey(tokenAddress)
//   const recipientPublicKey = new PublicKey(recipient)

//   // Get or create the associated token account for the recipient
//   const recipientTokenAccount = yield* call(
//     getOrCreateAssociatedTokenAccount,
//     connection,
//     airdropAdmin as Signer,
//     mintPublicKey,
//     recipientPublicKey
//   )

//   // Mint tokens
//   const transaction = yield* call(
//     mintTo,
//     connection,
//     airdropAdmin as Signer,
//     recipientTokenAccount.address,
//     mintPublicKey,
//     amount,
//     []
//   )

//   // Send and confirm the transaction
//   const signature = yield* call(sendAndConfirmTransaction, connection, transaction, [
//     wallet.publicKey
//   ])

//   return signature
// }
