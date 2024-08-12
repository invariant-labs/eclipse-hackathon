import { combineReducers } from 'redux'
import storage from 'redux-persist/lib/storage'
import { persistReducer, createTransform, createMigrate, MigrationManifest } from 'redux-persist'
import { NetworkType, RPC } from '@store/consts/static'
import { reducer as snackbarsReducer, snackbarsSliceName } from './snackbars'
import { reducer as solanaWalletReducer, solanaWalletSliceName } from './wallet'
import {
  ISolanaConnectionStore,
  reducer as solanaConnectionReducer,
  solanaConnectionSliceName
} from './connection'


const transformNetwork = createTransform(
  (inboundState: any, _key) => {
    return inboundState
  },
  (outboundState, key) => {
    if (key === 'network' && !Object.values(NetworkType).includes(outboundState)) {
      return NetworkType.MAINNET
    }

    return outboundState
  }
)

const migrations: MigrationManifest = {
    // @ts-expect-error
  1: (state: ISolanaConnectionStore) => {
    const network =
      typeof state?.network !== 'undefined' && Object.values(NetworkType).includes(state.network)
        ? state.network
        : NetworkType.MAINNET

    let rpcAddress

    switch (network) {
      case NetworkType.DEVNET:
        rpcAddress = RPC.DEV
        break
      case NetworkType.TESTNET:
        rpcAddress = RPC.TEST
        break
      case NetworkType.LOCALNET:
        rpcAddress = RPC.LOCAL
        break
      case NetworkType.MAINNET:
        rpcAddress = RPC.MAIN
        break
    }

    return {
      ...state,
      rpcAddress
    }
  }
}

const connectionPersistConfig = {
  key: solanaConnectionSliceName,
  version: 1,
  storage: storage,
  whitelist: ['network', 'rpcAddress'],
  transforms: [transformNetwork],
  migrate: createMigrate(migrations, { debug: false })
}

const combinedReducers = combineReducers({
  [snackbarsSliceName]: snackbarsReducer,
  [solanaConnectionSliceName]: persistReducer(connectionPersistConfig, solanaConnectionReducer),
  [solanaWalletSliceName]: solanaWalletReducer,
})

export default combinedReducers
