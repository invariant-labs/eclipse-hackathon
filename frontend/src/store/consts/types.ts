import { NetworkType } from "./static"

export interface TokenPriceData {
  price: number
}

export interface ISelectNetwork {
  networkType: NetworkType
  rpc: string
  rpcName?: string
}