import { Protocol } from '@invariant-labs/eclipse-link-sdk'
import { IWallet } from '@invariant-labs/eclipse-link-sdk/dist/wallet'
import { NetworkType } from '@store/consts/static'
import { getSolanaConnection, networkTypetoProgramNetwork } from '@utils/web3/connection'
import { getSolanaWallet } from '@utils/web3/wallet'

let _protocol: Protocol

export const getCurrentProtocolProgram = (): Protocol => {
  return _protocol
}

export const getProtocolProgram = async (
  networkType: NetworkType,
  rpcAddress: string
): Promise<Protocol> => {
  if (_protocol) {
    return _protocol
  }

  const net = networkTypetoProgramNetwork(networkType)

  _protocol = await Protocol.build(
    net,
    getSolanaWallet() as IWallet,
    getSolanaConnection(rpcAddress)
  )
  return _protocol
}
