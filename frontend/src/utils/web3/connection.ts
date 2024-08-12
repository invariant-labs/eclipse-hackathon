import { Connection } from '@solana/web3.js'
import { NetworkType, RPC } from '@store/consts/static'

let _connection: Connection | null = null
let _network: string

const getSolanaConnection = (url: string): Connection => {
  if (_connection && _network === url) {
    return _connection
  }
  _connection = new Connection(url, 'recent')
  _network = url

  return _connection
}

// const networkTypetoProgramNetwork = (type: NetworkType): Network => {
//   switch (type) {
//     case NetworkType.DEVNET:
//       return Network.DEV
//     case NetworkType.LOCALNET:
//       return Network.LOCAL
//     case NetworkType.TESTNET:
//       return Network.TEST
//     case NetworkType.MAINNET:
//       return Network.MAIN
//     default:
//       return Network.DEV
//   }
// }



const getCurrentSolanaConnection = (): Connection | null => {
  return _connection
}

export {
  getSolanaConnection,
  RPC,
  getCurrentSolanaConnection,
  // networkTypetoProgramNetwork
}
