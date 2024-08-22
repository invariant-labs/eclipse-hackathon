import { Liquidity } from '@components/Liquidity/Liquidity'
import { BN } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { ALL_FEE_TIERS_DATA, bestTiers, commonTokensForNetworks } from '@store/consts/static'
import { actions as poolsActions } from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { network } from '@store/selectors/connection'
import { canCreateNewPool, status, swapTokens } from '@store/selectors/wallet'
import { addNewTokenToLocalStorage, getNewTokenOrThrow, printBN } from '@utils/utils'
import { getCurrentSolanaConnection } from '@utils/web3/connection'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  getLiquidityByXInFullRange,
  getLiquidityByYInFullRange
} from '@invariant-labs/eclipse-link-sdk'
import { FEE_TIERS, feeToTickSpacing } from '@invariant-labs/sdk-eclipse/lib/utils'
import { lpPoolsArraySortedByFees, poolsArraySortedByFees } from '@store/selectors/pools'
import { Pair } from '@invariant-labs/sdk-eclipse'

export interface IProps {
  initialTokenFrom: string
  initialTokenTo: string
  initialFee: string
  initialTab: string
}

export const LiquidityWrapper: React.FC<IProps> = ({
  initialTokenFrom,
  initialTokenTo,
  initialFee,
  initialTab
}) => {
  const dispatch = useDispatch()

  const connection = getCurrentSolanaConnection()

  const tokens = useSelector(swapTokens)
  const walletStatus = useSelector(status)
  const currentNetwork = useSelector(network)

  const canUserCreateNewPool = useSelector(canCreateNewPool(currentNetwork))
  const [poolIndex, setPoolIndex] = useState<number | null>(null)
  const [lpPoolIndex, setLpPoolIndex] = useState<number | null>(null)

  // const [progress, setProgress] = useState<ProgressState>('none')
  const [feeIndex, setFeeIndex] = useState(0)
  const [tokenAIndex, setTokenAIndex] = useState<number | null>(null)
  const [tokenBIndex, setTokenBIndex] = useState<number | null>(null)

  const addTokenHandler = (address: string) => {
    if (
      connection !== null &&
      tokens.findIndex(token => token.address.toString() === address) === -1
    ) {
      getNewTokenOrThrow(address, connection)
        .then(data => {
          dispatch(poolsActions.addTokens(data))
          addNewTokenToLocalStorage(address, currentNetwork)
          dispatch(
            snackbarsActions.add({
              message: 'Token added to your list',
              variant: 'success',
              persist: false
            })
          )
        })
        .catch(() => {
          dispatch(
            snackbarsActions.add({
              message: 'Token adding failed, check if address is valid and try again',
              variant: 'error',
              persist: false
            })
          )
        })
    } else {
      dispatch(
        snackbarsActions.add({
          message: 'Token already exists on your list',
          variant: 'info',
          persist: false
        })
      )
    }
  }

  const setHideUnknownTokensValue = (val: boolean) => {
    localStorage.setItem('HIDE_UNKNOWN_TOKENS', val ? 'true' : 'false')
  }

  // const [tokenAPriceData, setTokenAPriceData] = useState<TokenPriceData | undefined>(undefined)
  // const [priceALoading, setPriceALoading] = useState(false)

  // const [tokenBPriceData, setTokenBPriceData] = useState<TokenPriceData | undefined>(undefined)
  // const [priceBLoading, setPriceBLoading] = useState(false)
  // const initialSlippage = localStorage.getItem('INVARIANT_NEW_POSITION_SLIPPAGE') ?? '1'

  const calcAmount = (amount: BN, tokenAddress: PublicKey) => {
    if (
      tokenAIndex === null ||
      tokenBIndex === null ||
      poolIndex === null ||
      tokenAIndex === tokenBIndex
    ) {
      return new BN(0)
    }

    const byX = tokenAddress.equals(
      isXtoY ? tokens[tokenAIndex].assetAddress : tokens[tokenBIndex].assetAddress
    )

    try {
      if (byX) {
        const result = getLiquidityByXInFullRange(
          amount,
          allPools[poolIndex].sqrtPrice,
          true,
          tickSpacing
        )
        if (isMountedRef.current) {
          liquidityRef.current = result.liquidity
        }
        return result.y
      }
      const result = getLiquidityByYInFullRange(
        amount,
        allPools[poolIndex].sqrtPrice,
        true,
        tickSpacing
      )
      if (isMountedRef.current) {
        liquidityRef.current = result.liquidity
      }
      return result.x
    } catch (error) {
      const result = (byX ? getLiquidityByYInFullRange : getLiquidityByXInFullRange)(
        amount,
        allPools[poolIndex].sqrtPrice,
        true,
        tickSpacing
      )
      if (isMountedRef.current) {
        liquidityRef.current = result.liquidity
      }
    }

    return new BN(0)
  }

  const initialHideUnknownTokensValue =
    localStorage.getItem('HIDE_UNKNOWN_TOKENS') === 'true' ||
    localStorage.getItem('HIDE_UNKNOWN_TOKENS') === null

  const allPools = useSelector(poolsArraySortedByFees)
  const allLpPools = useSelector(lpPoolsArraySortedByFees)
  const liquidityRef = useRef<any>({ v: new BN(0) })
  const isMountedRef = useRef(false)

  const fee = useMemo(() => ALL_FEE_TIERS_DATA[feeIndex].tier.fee, [feeIndex])

  const tickSpacing = useMemo(
    () =>
      ALL_FEE_TIERS_DATA[feeIndex].tier.tickSpacing ??
      feeToTickSpacing(ALL_FEE_TIERS_DATA[feeIndex].tier.fee),
    [feeIndex]
  )

  const isXtoY = useMemo(() => {
    if (tokenAIndex !== null && tokenBIndex !== null && tokenAIndex !== tokenBIndex) {
      return (
        tokens[tokenAIndex].assetAddress.toString() < tokens[tokenBIndex].assetAddress.toString()
      )
    }
    return true
  }, [tokenAIndex, tokenBIndex])

  useEffect(() => {
    if (tokenAIndex !== null && tokenBIndex !== null && tokenAIndex !== tokenBIndex) {
      const pair = new Pair(
        tokens[tokenAIndex].address,
        tokens[tokenBIndex].address,
        FEE_TIERS[feeIndex]
      )
      dispatch(poolsActions.getPoolData(pair))
      dispatch(poolsActions.getLpPoolData(pair))
    }
  }, [tokenAIndex, tokenBIndex, feeIndex])

  useEffect(() => {
    if (tokenAIndex !== null && tokenBIndex !== null) {
      const index = allPools.findIndex(
        pool =>
          pool.fee.v.eq(fee) &&
          ((pool.tokenX.equals(tokens[tokenAIndex].assetAddress) &&
            pool.tokenY.equals(tokens[tokenBIndex].assetAddress)) ||
            (pool.tokenX.equals(tokens[tokenBIndex].assetAddress) &&
              pool.tokenY.equals(tokens[tokenAIndex].assetAddress)))
      )

      setPoolIndex(index !== -1 ? index : null)
    }
  }, [allPools])

  useEffect(() => {
    if (tokenAIndex !== null && tokenBIndex !== null) {
      const index = allLpPools.findIndex(
        pool =>
          pool.fee.v.eq(fee) &&
          ((pool.tokenX.equals(tokens[tokenAIndex].assetAddress) &&
            pool.tokenY.equals(tokens[tokenBIndex].assetAddress)) ||
            (pool.tokenX.equals(tokens[tokenBIndex].assetAddress) &&
              pool.tokenY.equals(tokens[tokenAIndex].assetAddress)))
      )

      setLpPoolIndex(index !== -1 ? index : null)
    }
  }, [allLpPools])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return (
    <Liquidity
      initialTokenFrom={initialTokenFrom}
      initialTokenTo={initialTokenTo}
      initialFee={initialFee}
      initialTab={initialTab}
      tokens={tokens}
      midPrice={10}
      setMidPrice={() => {}}
      addLiquidityHandler={() => {}}
      removeLiquidityHandler={() => {
        if (tokenAIndex !== null && tokenBIndex !== null) {
          dispatch(
            poolsActions.burn(
              new Pair(
                tokens[tokenAIndex].address,
                tokens[tokenBIndex].address,
                FEE_TIERS[feeIndex]
              )
            )
          )
        }
      }}
      onChangePositionTokens={(tokenA, tokenB, feeTierIndex) => {
        setTokenAIndex(tokenA)
        setTokenBIndex(tokenB)
        setFeeIndex(feeTierIndex)
      }}
      calcAmount={calcAmount}
      feeTiers={ALL_FEE_TIERS_DATA.map(tier => ({
        feeValue: +printBN(tier.tier.fee, 10)
      }))}
      noConnectedBlockerProps={{
        onConnect: async () => {
          dispatch(walletActions.connect(false))
        },
        descCustomText: 'Cannot add any liquidity.'
      }}
      progress={'none'}
      isXtoY={true}
      xDecimal={tokenAIndex !== null ? tokens[tokenAIndex]?.decimals : 0}
      yDecimal={tokenBIndex !== null ? tokens[tokenBIndex]?.decimals : 0}
      tickSpacing={tickSpacing}
      isWaitingForNewPool={false}
      poolIndex={poolIndex}
      bestTiers={bestTiers[currentNetwork]}
      canCreateNewPool={canUserCreateNewPool}
      handleAddToken={addTokenHandler}
      commonTokens={commonTokensForNetworks[currentNetwork]}
      initialHideUnknownTokensValue={initialHideUnknownTokensValue}
      onHideUnknownTokensChange={setHideUnknownTokensValue}
      reloadHandler={() => {}}
      currentFeeIndex={feeIndex}
      setCurrentFeeIndex={setFeeIndex}
      showNoConnected={walletStatus !== Status.Initialized}
      tokenAPriceData={{ price: 1 }}
      tokenBPriceData={{ price: 1 }}
      priceALoading={false}
      priceBLoading={false}
      sqrtPrice={poolIndex !== null ? allPools[poolIndex].sqrtPrice : { v: new BN(0) }}
    />
  )
}

export default LiquidityWrapper
