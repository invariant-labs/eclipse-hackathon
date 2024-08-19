import { PublicKey, Transaction } from '@solana/web3.js'
import { WalletAdapter } from './types'
import { nightlyConnectAdapter } from '@utils/web3/selector'

export class StandardAdapter implements WalletAdapter {
  constructor() {
    this.connect = this.connect.bind(this)
  }

  get connected() {
    return nightlyConnectAdapter.connected
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    return await nightlyConnectAdapter.signAllTransactions(transactions)
  }

  get publicKey() {
    return nightlyConnectAdapter.publicKey ?? new PublicKey('')
  }

  async signTransaction(transaction: Transaction) {
    return await nightlyConnectAdapter.signTransaction(transaction)
  }

  connect = async () => {
    if (!nightlyConnectAdapter.connected) {
      try {
        await nightlyConnectAdapter.connect()
      } catch (error) {
        console.log(error)
      }
    }
  }

  disconnect = async () => {
    if (nightlyConnectAdapter) {
      try {
        await nightlyConnectAdapter.disconnect()
      } catch (error) {
        console.log(error)
      }
    }
  }
}
