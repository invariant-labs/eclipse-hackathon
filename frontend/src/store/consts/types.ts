import { NetworkType } from './static'

export interface TokenPriceData {
  price: number
}

export interface ISelectNetwork {
  networkType: NetworkType
  rpc: string
  rpcName?: string
}

export interface FormatNumberThreshold {
  value: number
  decimals: number
  divider?: number
}

export interface PrefixConfig {
  B?: number
  M?: number
  K?: number
}
