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
  import { createLoaderKey } from '@utils/utils'
  import { closeSnackbar } from 'notistack'
  import { actions, ITokenAccount, Status } from '@store/reducers/wallet'
import { WalletAdapter } from '@utils/web3/adapters/types'
import { BN } from '@project-serum/anchor'
import { getSolanaWallet } from '@utils/web3/wallet'
import { PublicKey } from '@solana/web3.js'
import { getConnection } from './connection'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { tokens } from '@store/selectors/pools'

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
  export function* fetchTokensAccounts(): Generator {

  }
  
  export function* getToken(tokenAddress: PublicKey): SagaGenerator<any> {

  }
  
  export function* handleAirdrop(): Generator {

  }
  
  export function* setEmptyAccounts(collateralsAddresses: PublicKey[]): Generator {

  }
  
  export function* transferAirdropSOL(): Generator {

  }
  
  export function* getCollateralTokenAirdrop(
    collateralsAddresses: PublicKey[],
    collateralsQuantities: number[]
  ): Generator {

  }

  export function* signAndSend(wallet: WalletAdapter, tx: any): SagaGenerator<string> {
    const connection = yield* call(getConnection)
    const blockhash = yield* call([connection, connection.getRecentBlockhash])
    tx.feePayer = wallet.publicKey
    tx.recentBlockhash = blockhash.blockhash
    const signedTx = yield* call([wallet, wallet.signTransaction], tx)
    const signature = yield* call([connection, connection.sendRawTransaction], signedTx.serialize())
    return signature
  }
  
  export function* createAccount(tokenAddress: PublicKey): SagaGenerator<any> {
 
  }
  
  export function* createMultipleAccounts(tokenAddress: PublicKey[]): SagaGenerator<any> {

  }
  
  export function* init(): Generator {
    yield* put(actions.setStatus(Status.Init))
    const wallet = yield* call(getWallet)
    // const balance = yield* call(getBalance, wallet.publicKey)
    yield* put(actions.setAddress(wallet.publicKey))
    yield* put(actions.setIsBalanceLoading(true))
    const balance = yield* call(getBalance, wallet.publicKey)
    yield* put(actions.setBalance(balance))
    yield* put(actions.setStatus(Status.Initialized))
    yield* call(fetchTokensAccounts)
    yield* put(actions.setIsBalanceLoading(false))
  }
  
  // eslint-disable-next-line @typescript-eslint/promise-function-async
  export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  export function* sendSol(amount: BN, recipient: PublicKey): SagaGenerator<any> {

  }
  
  export function* handleConnect(): Generator {

  }
  
  export function* handleDisconnect(): Generator {
  }
  
  export function* connectHandler(): Generator {
    yield takeLatest(actions.connect, handleConnect)
  }
  
  export function* disconnectHandler(): Generator {
    yield takeLatest(actions.disconnect, handleDisconnect)
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
  
  export function* walletSaga(): Generator {
    yield all(
      [initSaga, airdropSaga, connectHandler, disconnectHandler, handleBalanceSaga].map(spawn)
    )
  }
  