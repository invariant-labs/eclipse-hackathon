import { actions, PairTokens, PoolWithAddress } from '@store/reducers/pools'
import { network, rpcAddress } from '@store/selectors/connection'
import { all, call, put, select, spawn, takeLatest } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { getMarketProgram } from '@web3/programs/amm'
import { getPools } from '@store/consts/utils'
import { Pair } from '@invariant-labs/sdk-eclipse'
import { FEE_TIERS } from '@invariant-labs/sdk-eclipse/lib/utils'
import { getProtocolProgram } from '@web3/programs/protocol'

export interface iTick {
  index: iTick[]
}

export function* fetchPoolData(action: PayloadAction<Pair>) {
  const networkType = yield* select(network)
  const rpc = yield* select(rpcAddress)
  const marketProgram = yield* call(getMarketProgram, networkType, rpc)
  try {
    const poolData = yield* call([marketProgram, marketProgram.getPool], action.payload)
    const address = yield* call(
      [action.payload, action.payload.getAddress],
      marketProgram.program.programId
    )

    yield* put(
      actions.addPools([
        {
          ...poolData,
          address
        }
      ])
    )
  } catch (error) {
    yield* put(actions.addPools([]))
  }
}

export function* fetchAllPoolsForPairData(action: PayloadAction<PairTokens>) {
  const networkType = yield* select(network)
  const rpc = yield* select(rpcAddress)
  const marketProgram = yield* call(getMarketProgram, networkType, rpc)
  const pairs = FEE_TIERS.map(fee => new Pair(action.payload.first, action.payload.second, fee))
  const pools: PoolWithAddress[] = yield call(getPools, pairs, marketProgram)

  yield* put(actions.addPools(pools))
}

export function* fetchLpPoolData(action: PayloadAction<Pair>) {
  const networkType = yield* select(network)
  const rpc = yield* select(rpcAddress)
  const protocolProgram = yield* call(getProtocolProgram, networkType, rpc)
  try {
    const poolData = yield* call([protocolProgram, protocolProgram.getLpPool], action.payload)
    const address = yield* call(
      [action.payload, action.payload.getAddress],
      protocolProgram.program.programId
    )

    yield* put(
      actions.addLpPools([
        {
          ...poolData,
          address
        }
      ])
    )
  } catch (error) {
    yield* put(actions.addLpPools([]))
  }
}

export function* getPoolDataHandler(): Generator {
  yield* takeLatest(actions.getPoolData, fetchPoolData)
}

export function* getAllPoolsForPairDataHandler(): Generator {
  yield* takeLatest(actions.getAllPoolsForPairData, fetchAllPoolsForPairData)
}

export function* getLpPoolDataHandler(): Generator {
  yield* takeLatest(actions.getLpPoolData, fetchLpPoolData)
}

export function* poolsSaga(): Generator {
  yield all([getPoolDataHandler, getAllPoolsForPairDataHandler, getLpPoolDataHandler].map(spawn))
}
