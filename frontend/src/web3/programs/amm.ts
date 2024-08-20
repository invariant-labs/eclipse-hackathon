import { getMarketAddress, Market } from '@invariant-labs/sdk-eclipse'
import { PublicKey } from '@solana/web3.js'
import { NetworkType } from '@store/consts/static'
import { getSolanaConnection, networkTypetoProgramNetwork } from '@utils/web3/connection'
import { getSolanaWallet } from '@utils/web3/wallet'

let _market: Market

export const getCurrentMarketProgram = (): Market => {
  return _market
}

export const getMarketProgram = async (
  networkType: NetworkType,
  rpcAddress: string
): Promise<Market> => {
  if (_market) {
    return _market
  }

  const net = networkTypetoProgramNetwork(networkType)

  _market = await Market.build(
    net,
    getSolanaWallet(),
    getSolanaConnection(rpcAddress),
    new PublicKey(getMarketAddress(net))
  )
  return _market
}
