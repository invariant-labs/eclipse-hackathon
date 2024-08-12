import { Network, initPolkadotApi } from '@invariant-labs/a0-sdk'
import { ApiPromise } from '@polkadot/api'

class SingletonApi {
  static api: ApiPromise | null = null
  static rpc: string | null = null
  static network: Network | null = null

  static getInstance(): ApiPromise | null {
    return this.api
  }

  static async loadInstance(network: Network, rpc: string): Promise<ApiPromise> {
    if (!this.api || network !== this.network || rpc !== this.rpc) {
      this.api = await initPolkadotApi(network, rpc)
      this.network = network
      this.rpc = rpc
    }

    return this.api
  }
}

export default SingletonApi
