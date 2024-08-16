import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PublicKey } from '@solana/web3.js'
import { Token } from '@store/consts/static'
import { PayloadType } from '@store/reducers/types'

// export interface PoolWithAddress extends PoolStructure {
//   address: PublicKey
// }

export interface IPoolsStore {
  tokens: Record<string, Token>
  //   pools: { [key in string]: PoolWithAddress }
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
  //   pools: {},
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
    }
  }
})

export const actions = poolsSlice.actions
export const reducer = poolsSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
