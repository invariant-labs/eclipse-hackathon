import { createSelector } from '@reduxjs/toolkit'
import { IPoolsStore, poolsSliceName } from '../reducers/pools'
import { keySelectors, AnyProps } from './helpers'

const store = (s: AnyProps) => s[poolsSliceName] as IPoolsStore

export const { tokens, isLoadingLatestPoolsForTransaction } = keySelectors(store, [
  'tokens',
  'isLoadingLatestPoolsForTransaction'
])

// export const poolsArraySortedByFees = createSelector(pools, allPools =>
//   Object.values(allPools).sort((a, b) => Number(a.poolKey.feeTier.fee - b.poolKey.feeTier.fee))
// )

export const hasTokens = createSelector(tokens, allTokens => !!Object.values(allTokens).length)

export const poolsSelectors = {
  tokens,
  isLoadingLatestPoolsForTransaction
}

export default poolsSelectors
