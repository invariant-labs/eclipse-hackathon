import { Invariant, Network } from '@invariant-labs/a0-sdk'
import { ApiPromise } from '@polkadot/api'
import { DEFAULT_INVARIANT_OPTIONS } from '@store/consts/static'

class SingletonInvariant {
  static invariant: Invariant | null = null
  static api: ApiPromise | null = null
  static network: Network | null = null

  static getInstance(): Invariant | null {
    return this.invariant
  }

  static async loadInstance(
    api: ApiPromise,
    network: Network,
    address: string
  ): Promise<Invariant> {
    if (
      !this.invariant ||
      api !== this.api ||
      network !== this.network ||
      address !== this.invariant.contract.address.toString()
    ) {
      this.invariant = await Invariant.load(api, network, address, DEFAULT_INVARIANT_OPTIONS)
      this.api = api
      this.network = network
    }

    return this.invariant
  }
}

export default SingletonInvariant
