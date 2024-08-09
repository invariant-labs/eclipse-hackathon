import { Position } from '@invariant-labs/a0-sdk'
import { poolKeyToString } from '@utils/utils'
import { PoolWithPoolKey } from '@store/reducers/pools'
import { createSelector } from 'reselect'
import { IPositionsStore, positionsSliceName } from '../reducers/positions'
import { AnyProps, keySelectors } from './helpers'
import { poolsArraySortedByFees } from './pools'
import { swapTokens } from './wallet'
import { Token } from '@store/consts/types'

const store = (s: AnyProps) => s[positionsSliceName] as IPositionsStore

export const {
  lastPage,
  positionsList,
  plotTicks,
  currentPositionTicks,
  initPosition,
  shouldNotUpdateRange
} = keySelectors(store, [
  'lastPage',
  'positionsList',
  'plotTicks',
  'currentPositionTicks',
  'initPosition',
  'shouldNotUpdateRange'
])

export const lastPageSelector = createSelector(lastPage, s => s)

export const isLoadingPositionsList = createSelector(positionsList, s => s.loading)

export interface PoolWithPoolKeyAndIndex extends PoolWithPoolKey {
  poolIndex: number
}

export interface PositionWithPoolData extends Position {
  poolData: PoolWithPoolKeyAndIndex
  tokenX: Token
  tokenY: Token
  positionIndex: number
}

export const positionsWithPoolsData = createSelector(
  poolsArraySortedByFees,
  positionsList,
  swapTokens,
  (allPools, { list }, tokens) => {
    const poolsByKey: Record<string, PoolWithPoolKeyAndIndex> = {}
    allPools.forEach((pool, index) => {
      poolsByKey[poolKeyToString(pool.poolKey)] = {
        ...pool,
        poolIndex: index
      }
    })

    const result = []
    for (let index = 0; index < list.length; index++) {
      const position = list[index]
      const tokenX = tokens.find(token => token.assetAddress === position.poolKey.tokenX)
      const tokenY = tokens.find(token => token.assetAddress === position.poolKey.tokenY)

      if (!tokenX) {
        continue
      } else if (!tokenY) {
        continue
      }

      result.push({
        ...position,
        poolData: poolsByKey[poolKeyToString(position.poolKey)],
        tokenX,
        tokenY,
        positionIndex: index
      })
    }

    return result
  }
)

export const singlePositionData = (id: bigint) =>
  createSelector(positionsWithPoolsData, positions =>
    positions.find(position => id === BigInt(position.positionIndex))
  )

export const positionsSelectors = {
  positionsList,
  plotTicks,
  currentPositionTicks,
  initPosition,
  shouldNotUpdateRange
}

export default positionsSelectors
