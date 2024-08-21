import {
  call,
  takeLeading,
  SagaGenerator,
  put,
  spawn,
  all,
  select,
  takeLatest
} from 'typed-redux-saga'
import { createLoaderKey, getTokenProgramId } from '@utils/utils'
import { closeSnackbar } from 'notistack'
import { actions, ITokenAccount, Status } from '@store/reducers/wallet'
import {
  NetworkType,
  Token as StoreToken,
  airdropQuantities,
  airdropTokens
} from '@store/consts/static'
import { WalletAdapter } from '@utils/web3/adapters/types'
import { BN } from '@project-serum/anchor'
import { disconnectWallet, getSolanaWallet } from '@utils/web3/wallet'
import {
  AccountInfo,
  ParsedAccountData,
  PublicKey,
  RpcResponseAndContext,
  Signer,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmRawTransaction
} from '@solana/web3.js'
import { getConnection } from './connection'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Mint,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMint
} from '@solana/spl-token'
import { tokens } from '@store/selectors/pools'
import { actions as poolsActions } from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { accounts, status } from '@store/selectors/wallet'
import { network } from '@store/selectors/connection'
import airdropAdmin from '@store/consts/airdropAdmin'
import { getTokenDetails } from './token'
import { openWalletSelectorModal } from '@utils/web3/selector'
import { PayloadAction } from '@reduxjs/toolkit'
import { TOKEN_2022_PROGRAM_ID } from '@invariant-labs/sdk-eclipse'

export function* getWallet(): SagaGenerator<WalletAdapter> {
  const wallet = yield* call(getSolanaWallet)

  return wallet
}
export function* getBalance(pubKey: PublicKey): SagaGenerator<BN> {
  const connection = yield* call(getConnection)
  const balance = yield* call([connection, connection.getBalance], pubKey)
  return new BN(balance)
}

export function* handleBalance(): Generator {
  const wallet = yield* call(getWallet)
  yield* put(actions.setAddress(wallet.publicKey))
  yield* put(actions.setIsBalanceLoading(true))
  const balance = yield* call(getBalance, wallet.publicKey)
  yield* put(actions.setBalance(balance))
  yield* call(fetchTokensAccounts)
  yield* put(actions.setIsBalanceLoading(false))
}

interface IparsedTokenInfo {
  mint: string
  owner: string
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number
  }
}

interface TokenAccountInfo {
  pubkey: PublicKey
  account: AccountInfo<ParsedAccountData>
}
export function* fetchTokensAccounts(): Generator {
  const connection = yield* call(getConnection)
  const wallet = yield* call(getWallet)
  console.log(connection)
  const splTokensAccounts: RpcResponseAndContext<TokenAccountInfo[]> = yield* call(
    [connection, connection.getParsedTokenAccountsByOwner],
    wallet.publicKey,
    {
      programId: TOKEN_PROGRAM_ID
    }
  )
  console.log(splTokensAccounts)
  const token2022TokensAccounts: RpcResponseAndContext<TokenAccountInfo[]> = yield* call(
    [connection, connection.getParsedTokenAccountsByOwner],
    wallet.publicKey,
    {
      programId: TOKEN_2022_PROGRAM_ID
    }
  )
  console.log(token2022TokensAccounts)
  const mergedAccounts: TokenAccountInfo[] = [
    ...splTokensAccounts.value,
    ...token2022TokensAccounts.value
  ]
  console.log(mergedAccounts)
  const allTokens = yield* select(tokens)
  const newAccounts: ITokenAccount[] = []
  const unknownTokens: Record<string, StoreToken> = {}
  for (const account of mergedAccounts) {
    const info: IparsedTokenInfo = account.account.data.parsed.info
    newAccounts.push({
      programId: new PublicKey(info.mint),
      balance: new BN(info.tokenAmount.amount),
      address: account.pubkey,
      decimals: info.tokenAmount.decimals
    })

    if (!allTokens[info.mint]) {
      unknownTokens[info.mint] = {
        name: info.mint,
        symbol: `${info.mint.slice(0, 4)}...${info.mint.slice(-4)}`,
        decimals: info.tokenAmount.decimals,
        address: new PublicKey(info.mint),
        logoURI: '/unknownToken.svg',
        isUnknown: true
      }
    }
  }
  console.log(newAccounts)
  console.log(unknownTokens)
  yield* put(actions.addTokenAccounts(newAccounts))
  yield* put(poolsActions.addTokens(unknownTokens))
}

export function* getToken(tokenAddress: PublicKey): SagaGenerator<Mint> {
  const connection = yield* call(getConnection)

  const mintInfo = yield* call(getMint, connection, tokenAddress)
  console.log(mintInfo)
  return mintInfo
}

export function* handleAirdrop(): Generator {
  const walletStatus = yield* select(status)
  if (walletStatus !== Status.Initialized) {
    yield put(
      snackbarsActions.add({
        message: 'Connect your wallet first',
        variant: 'warning',
        persist: false
      })
    )
    return
  }

  const loaderKey = createLoaderKey()
  yield put(
    snackbarsActions.add({
      message: 'Airdrop in progress',
      variant: 'pending',
      persist: true,
      key: loaderKey
    })
  )

  const connection = yield* call(getConnection)
  const networkType = yield* select(network)
  const wallet = yield* call(getWallet)

  if (networkType === NetworkType.TESTNET) {
    // transfer sol
    // yield* call([connection, connection.requestAirdrop], airdropAdmin.publicKey, 1 * 1e9)
    yield* call(transferAirdropSOL)
    yield* call(
      getCollateralTokenAirdrop,
      airdropTokens[networkType],
      airdropQuantities[networkType]
    )

    yield put(
      snackbarsActions.add({
        message: 'You will soon receive airdrop of tokens',
        variant: 'success',
        persist: false
      })
    )
  } else {
    yield* call([connection, connection.requestAirdrop], wallet.publicKey, 1 * 1e9)

    yield* call(
      getCollateralTokenAirdrop,
      airdropTokens[networkType],
      airdropQuantities[networkType]
    )
    yield put(
      snackbarsActions.add({
        message: 'You will soon receive airdrop',
        variant: 'success',
        persist: false
      })
    )
  }

  closeSnackbar(loaderKey)
  yield put(snackbarsActions.remove(loaderKey))
}

export function* setEmptyAccounts(collateralsAddresses: PublicKey[]): Generator {
  const tokensAccounts = yield* select(accounts)
  const acc: PublicKey[] = []
  for (const collateral of collateralsAddresses) {
    const collateralTokenProgram = yield* call(getToken, collateral)
    const accountAddress = tokensAccounts[collateral.toString()]
      ? tokensAccounts[collateral.toString()].address
      : null
    if (accountAddress == null) {
      acc.push(new PublicKey(collateralTokenProgram.address))
    }
  }
  if (acc.length !== 0) {
    yield* call(createMultipleAccounts, acc)
  }
}

export function* transferAirdropSOL(): Generator {
  const wallet = yield* call(getWallet)

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: airdropAdmin.publicKey,
      toPubkey: wallet.publicKey,
      lamports: 30000
    })
  )
  const connection = yield* call(getConnection)
  const blockhash = yield* call([connection, connection.getRecentBlockhash])
  tx.feePayer = airdropAdmin.publicKey
  tx.recentBlockhash = blockhash.blockhash
  tx.setSigners(airdropAdmin.publicKey)
  tx.partialSign(airdropAdmin as Signer)

  const txid = yield* call(sendAndConfirmRawTransaction, connection, tx.serialize(), {
    skipPreflight: false
  })

  if (!txid.length) {
    yield put(
      snackbarsActions.add({
        message: 'Failed to airdrop testnet ETH. Please try again.',
        variant: 'error',
        persist: false,
        txid
      })
    )
  } else {
    yield put(
      snackbarsActions.add({
        message: 'Testnet ETH airdrop successfully.',
        variant: 'success',
        persist: false,
        txid
      })
    )
  }
}

export function* getCollateralTokenAirdrop(
  collateralsAddresses: PublicKey[],
  collateralsQuantities: number[]
): Generator {
  const wallet = yield* call(getWallet)
  const instructions: TransactionInstruction[] = []

  yield* call(setEmptyAccounts, collateralsAddresses)

  const tokensAccounts = yield* select(accounts)

  for (const [index, collateral] of collateralsAddresses.entries()) {
    instructions.push(
      createMintToInstruction(
        collateral,
        tokensAccounts[collateral.toString()].address,
        airdropAdmin.publicKey,
        collateralsQuantities[index],
        [],
        TOKEN_PROGRAM_ID
      )
    )
  }

  const tx = instructions.reduce((tx, ix) => tx.add(ix), new Transaction())

  const connection = yield* call(getConnection)
  const { blockhash } = yield* call([connection, connection.getLatestBlockhash])

  tx.feePayer = wallet.publicKey
  tx.recentBlockhash = blockhash

  const signedTx = yield* call([wallet, wallet.signTransaction], tx)
  signedTx.partialSign(airdropAdmin)

  yield* call([connection, connection.sendRawTransaction], signedTx.serialize(), {
    skipPreflight: true
  })
}

export function* signAndSend(wallet: WalletAdapter, tx: Transaction): SagaGenerator<string> {
  const connection = yield* call(getConnection)
  const blockhash = yield* call([connection, connection.getRecentBlockhash])
  tx.feePayer = wallet.publicKey
  tx.recentBlockhash = blockhash.blockhash
  const signedTx = yield* call([wallet, wallet.signTransaction], tx)
  const signature = yield* call([connection, connection.sendRawTransaction], signedTx.serialize())
  return signature
}

export function* createAccount(tokenAddress: PublicKey): SagaGenerator<PublicKey> {
  const wallet = yield* call(getWallet)
  const associatedAccount = yield* call(
    getAssociatedTokenAddress,
    tokenAddress,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  const ix = createAssociatedTokenAccountInstruction(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    tokenAddress,
    associatedAccount,
    wallet.publicKey,
    wallet.publicKey
  )
  yield* call(signAndSend, wallet, new Transaction().add(ix))
  const token = yield* call(getTokenDetails, tokenAddress.toString())
  yield* put(
    actions.addTokenAccount({
      programId: tokenAddress,
      balance: new BN(0),
      address: associatedAccount,
      decimals: token.decimals
    })
  )
  const allTokens = yield* select(tokens)
  if (!allTokens[tokenAddress.toString()]) {
    yield* put(
      poolsActions.addTokens({
        [tokenAddress.toString()]: {
          name: tokenAddress.toString(),
          symbol: `${tokenAddress.toString().slice(0, 4)}...${tokenAddress.toString().slice(-4)}`,
          decimals: token.decimals,
          address: tokenAddress,
          logoURI: '/unknownToken.svg',
          isUnknown: true
        }
      })
    )
  }
  yield* call(sleep, 1000) // Give time to subscribe to new token
  return associatedAccount
}

export function* createMultipleAccounts(tokenAddress: PublicKey[]): SagaGenerator<PublicKey[]> {
  const wallet = yield* call(getWallet)
  const ixs: TransactionInstruction[] = []
  const associatedAccs: PublicKey[] = []

  for (const address of tokenAddress) {
    const associatedAccount = yield* call(
      getAssociatedTokenAddress,
      address,
      wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    associatedAccs.push(associatedAccount)

    const ix = createAssociatedTokenAccountInstruction(
      wallet.publicKey, // Payer
      associatedAccount, // Associated token account
      wallet.publicKey, // Owner
      address, // Mint address
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    )
    ixs.push(ix)
  }

  // Sign and send the transaction
  yield* call(
    signAndSend,
    wallet,
    ixs.reduce((tx, ix) => tx.add(ix), new Transaction())
  )

  const allTokens = yield* select(tokens)
  const unknownTokens: Record<string, StoreToken> = {}

  for (const [index, address] of tokenAddress.entries()) {
    const token = yield* call(getTokenDetails, address.toString())
    yield* put(
      actions.addTokenAccount({
        programId: address,
        balance: new BN(0),
        address: associatedAccs[index],
        decimals: token.decimals
      })
    )

    // Give time to subscribe to the new token
    yield* call(sleep, 1000)

    if (!allTokens[address.toString()]) {
      unknownTokens[address.toString()] = {
        name: address.toString(),
        symbol: `${address.toString().slice(0, 4)}...${address.toString().slice(-4)}`,
        decimals: token.decimals,
        address,
        logoURI: '/unknownToken.svg',
        isUnknown: true
      }
    }
  }

  yield* put(poolsActions.addTokens(unknownTokens))

  return associatedAccs
}

export function* init(isEagerConnect?: boolean): Generator {
  try {
    yield* put(actions.setStatus(Status.Init))

    yield* call(openWalletSelectorModal, true)

    const wallet = yield* call(getWallet)

    if (isEagerConnect) {
      yield* put(
        snackbarsActions.add({
          message: 'Wallet reconnected.',
          variant: 'success',
          persist: false
        })
      )
    } else {
      yield* put(
        snackbarsActions.add({
          message: 'Wallet connected.',
          variant: 'success',
          persist: false
        })
      )
    }
    yield* put(actions.setAddress(wallet.publicKey))
    yield* put(actions.setIsBalanceLoading(true))
    const balance = yield* call(getBalance, wallet.publicKey)
    yield* put(actions.setBalance(balance))
    yield* put(actions.setStatus(Status.Initialized))
    yield* call(fetchTokensAccounts)
    yield* put(actions.setIsBalanceLoading(false))
  } catch (error) {
    yield* put(actions.setStatus(Status.Uninitialized))
    console.log(error)
  }
}

export function* handleReconnect(): Generator {
  yield* call(handleDisconnect)
  yield* call(openWalletSelectorModal, true)
  yield* call(handleConnect, { type: actions.connect.type, payload: false })
}

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
export function* sendSol(amount: BN, recipient: PublicKey): SagaGenerator<string> {
  const wallet = yield* call(getWallet)
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: amount.toNumber()
    })
  )

  const txid = yield* call(signAndSend, wallet, transaction)
  return txid
}

export function* handleConnect(action: PayloadAction<boolean>): Generator {
  const walletStatus = yield* select(status)

  if (walletStatus === Status.Initialized) {
    yield* put(
      snackbarsActions.add({
        message: 'Wallet already connected.',
        variant: 'info',
        persist: false
      })
    )
    return
  }
  yield* call(init, action.payload)
}

export function* handleDisconnect(): Generator {
  try {
    yield* call(disconnectWallet)
    yield* put(actions.resetState())

    yield* put(
      snackbarsActions.add({
        message: 'Wallet disconnected.',
        variant: 'success',
        persist: false
      })
    )

    // yield* put(positionsActions.setPositionsList([]))

    // yield* put(
    //   positionsActions.setCurrentPositionRangeTicks({
    //     lowerTick: undefined,
    //     upperTick: undefined
    //   })
    // )
  } catch (error) {
    console.log(error)
  }
}

export function* connectHandler(): Generator {
  yield takeLeading(actions.connect, handleConnect)
}

export function* disconnectHandler(): Generator {
  yield takeLeading(actions.disconnect, handleDisconnect)
}

export function* airdropSaga(): Generator {
  yield takeLeading(actions.airdrop, handleAirdrop)
}

export function* initSaga(): Generator {
  yield takeLeading(actions.initWallet, init)
}

export function* handleBalanceSaga(): Generator {
  yield takeLeading(actions.getBalance, handleBalance)
}

export function* reconnecthandler(): Generator {
  yield takeLatest(actions.reconnect, handleReconnect)
}

export function* walletSaga(): Generator {
  yield all(
    [
      initSaga,
      airdropSaga,
      connectHandler,
      disconnectHandler,
      handleBalanceSaga,
      reconnecthandler
    ].map(spawn)
  )
}
