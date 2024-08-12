import createSagaMiddleware from 'redux-saga'
import { configureStore, isPlain } from '@reduxjs/toolkit'
import combinedReducers from './reducers'
import rootSaga from './sagas'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@project-serum/anchor'

function isBN(value: unknown): value is BN {
  return BN.isBN(value)
}

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
)

const isSerializable = (value: unknown) => {
  return typeof value === 'bigint' || value instanceof PublicKey || isBN(value) || isPlain(value)
}

const getEntries = (value: unknown): [string, unknown][] => {
  if (typeof value === 'bigint') {
    return [['bigint', value.toString()]]
  }
  if (value instanceof PublicKey) {
    return [['publicKey', value.toBase58()]]
  }
  if (isBN(value)) {
    return [['bn', value.toString()]]
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
  }
  return []
}
const configureAppStore = (initialState = {}) => {
  const reduxSagaMonitorOptions = {}
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions)

  const middleware = [sagaMiddleware]

  const store = configureStore({
    reducer: combinedReducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          isSerializable,
          getEntries,
          ignoredActions: ['positions/closePosition', 'pools/setTickMaps', 'persist/PERSIST'],
          ignoredPaths: ['solanaWallet.address']
        }
      }).concat(middleware),
    preloadedState: initialState,
    devTools: isLocalhost
      ? {
          serialize: {
            replacer: (_key, value) => {
              if (typeof value === 'bigint') return value.toString()
              if (value instanceof PublicKey) return value.toBase58()
              if (isBN(value)) return value.toString()
              return value
            },
            options: true
          }
        }
      : false
  })

  sagaMiddleware.run(rootSaga)
  return store
}

export const store = configureAppStore()

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
