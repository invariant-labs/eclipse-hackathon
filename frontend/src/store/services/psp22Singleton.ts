import { Network, PSP22 } from '@invariant-labs/a0-sdk'
import { ApiPromise } from '@polkadot/api'
import { DEFAULT_PSP22_OPTIONS } from '@store/consts/static'

class SingletonPSP22 {
  static psp22: PSP22 | null = null
  static api: ApiPromise | null = null
  static network: Network | null = null

  static getInstance(): PSP22 | null {
    return this.psp22
  }

  static async loadInstance(api: ApiPromise, network: Network): Promise<PSP22> {
    if (!this.psp22 || api !== this.api || network !== this.network) {
      this.psp22 = await PSP22.load(api, network, DEFAULT_PSP22_OPTIONS)
      this.api = api
      this.network = network
    }

    return this.psp22
  }
}

export default SingletonPSP22
