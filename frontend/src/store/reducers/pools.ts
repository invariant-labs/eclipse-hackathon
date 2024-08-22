import { LpPoolStructure } from '@invariant-labs/eclipse-link-sdk/dist/types'
import { Pair } from '@invariant-labs/sdk-eclipse'
import { PoolStructure } from '@invariant-labs/sdk-eclipse/lib/market'
import { BN } from '@project-serum/anchor'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PublicKey } from '@solana/web3.js'
import { Token } from '@store/consts/static'
import { PayloadType } from '@store/reducers/types'
import * as R from 'remeda'

export interface PoolWithAddress extends PoolStructure {
  address: PublicKey
}

export interface LpPoolWithAddress extends LpPoolStructure {
  address: PublicKey
}

export interface IPoolsStore {
  tokens: Record<string, Token>
  pools: { [key in string]: PoolWithAddress }
  lpPools: { [key in string]: LpPoolWithAddress }
  //   poolTicks: { [key in string]: Tick[] }
  //   nearestPoolTicksForPair: { [key in string]: Tick[] }
  isLoadingLatestPoolsForTransaction: boolean
  //   tickMaps: { [key in string]: Tickmap }
  // volumeRanges: Record<string, Range[]>
}

// export interface UpdatePool {
//   address: PublicKey
//   poolStructure: PoolStructure
// }

// export interface updateTickMaps {
//   index: string
//   tickMapStructure: Tickmap
// }

// export interface UpdateTick {
//   index: string
//   tickStructure: Tick[]
// }
export interface DeleteTick {
  address: string
  index: number
}
// export interface UpdateTicks extends DeleteTick {
//   tick: Tick
// }

export interface UpdateTickmap {
  address: string
  bitmap: number[]
}

export interface FetchTicksAndTickMaps {
  tokenFrom: PublicKey
  tokenTo: PublicKey
  //   allPools: PoolWithAddress[]
}

export const defaultState: IPoolsStore = {
  tokens: {},
  pools: {},
  lpPools: {},
  //   poolTicks: {},
  //   nearestPoolTicksForPair: {},
  isLoadingLatestPoolsForTransaction: false
  //   tickMaps: {},
  // volumeRanges: {}
}

export interface PairTokens {
  first: PublicKey
  second: PublicKey
}

export enum ListType {
  POSITIONS,
  FARMS
}

export interface ListPoolsRequest {
  addresses: string[]
  listType: ListType
}

export interface ListPoolsResponse {
  //   data: PoolWithAddress[]
  listType: ListType
}

export interface MintData {
  pair: Pair
  tokenXDeposit: BN
  tokenYDeposit: BN
  lpPoolExists: boolean
}

export const poolsSliceName = 'pools'
const poolsSlice = createSlice({
  name: poolsSliceName,
  initialState: defaultState,
  reducers: {
    addTokens(state, action: PayloadAction<Record<string, Token>>) {
      state.tokens = {
        ...state.tokens,
        ...action.payload
      }
      return state
    },
    getPoolData(state, _action: PayloadAction<Pair>) {
      state.isLoadingLatestPoolsForTransaction = true

      return state
    },
    addPools(state, action: PayloadAction<PoolWithAddress[]>) {
      const newData = action.payload.reduce(
        (acc, pool) => ({
          ...acc,
          [pool.address.toString()]: pool
        }),
        {}
      )
      state.pools = R.merge(state.pools, newData)
      state.isLoadingLatestPoolsForTransaction = false
      return state
    },
    getAllPoolsForPairData(state, _action: PayloadAction<PairTokens>) {
      state.isLoadingLatestPoolsForTransaction = true

      return state
    },
    getLpPoolData(state, _action: PayloadAction<Pair>) {
      state.isLoadingLatestPoolsForTransaction = true

      return state
    },
    addLpPools(state, action: PayloadAction<LpPoolWithAddress[]>) {
      const newData = action.payload.reduce(
        (acc, pool) => ({
          ...acc,
          [pool.address.toString()]: pool
        }),
        {}
      )
      state.lpPools = R.merge(state.lpPools, newData)
      state.isLoadingLatestPoolsForTransaction = false
      return state
    },
    mint(state, _action: PayloadAction<MintData>) {
      return state
    }
  }
})

export const actions = poolsSlice.actions
export const reducer = poolsSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
