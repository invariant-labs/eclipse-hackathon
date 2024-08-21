import { createSelector } from '@reduxjs/toolkit'
import { IPoolsStore, poolsSliceName } from '../reducers/pools'
import { keySelectors, AnyProps } from './helpers'

const store = (s: AnyProps) => s[poolsSliceName] as IPoolsStore

export const { tokens, pools, lpPools, isLoadingLatestPoolsForTransaction } = keySelectors(store, [
  'tokens',
  'pools',
  'lpPools',
  'isLoadingLatestPoolsForTransaction'
])

export const poolsArraySortedByFees = createSelector(pools, allPools =>
  Object.values(allPools).sort((a, b) => a.fee.v.sub(b.fee.v).toNumber())
)

export const lpPoolsArraySortedByFees = createSelector(lpPools, allLpPools =>
  Object.values(allLpPools).sort((a, b) => a.fee.v.sub(b.fee.v).toNumber())
)

export const hasTokens = createSelector(tokens, allTokens => !!Object.values(allTokens).length)

export const poolsSelectors = {
  tokens,
  isLoadingLatestPoolsForTransaction
}

export default poolsSelectors
