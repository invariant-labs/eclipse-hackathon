import { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import { Liquidity } from '@components/Liquidity/Liquidity'
import { Pair } from '@invariant-labs/sdk-eclipse'
import { getLiquidityByX, getLiquidityByY } from '@invariant-labs/sdk-eclipse/lib/math'
import {
  FEE_TIERS,
  feeToTickSpacing,
  getMaxTick,
  getMinTick
} from '@invariant-labs/sdk-eclipse/lib/utils'
import { BN } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { ALL_FEE_TIERS_DATA, bestTiers, commonTokensForNetworks } from '@store/consts/static'
import { TokenPriceData } from '@store/consts/types'
import { actions as poolsActions } from '@store/reducers/pools'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { network } from '@store/selectors/connection'
import { poolsArraySortedByFees } from '@store/selectors/pools'
import { canCreateNewPool, status, swapTokens } from '@store/selectors/wallet'
import { addNewTokenToLocalStorage, getNewTokenOrThrow, printBN } from '@utils/utils'
import { getCurrentSolanaConnection } from '@utils/web3/connection'
import { VariantType } from 'notistack'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

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

  const [progress, setProgress] = useState<ProgressState>('none')
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

  const copyPoolAddressHandler = (message: string, variant: VariantType) => {
    dispatch(
      snackbarsActions.add({
        message,
        variant,
        persist: false
      })
    )
  }

  const setHideUnknownTokensValue = (val: boolean) => {
    localStorage.setItem('HIDE_UNKNOWN_TOKENS', val ? 'true' : 'false')
  }

  const [tokenAPriceData, setTokenAPriceData] = useState<TokenPriceData | undefined>(undefined)
  const [priceALoading, setPriceALoading] = useState(false)

  const [tokenBPriceData, setTokenBPriceData] = useState<TokenPriceData | undefined>(undefined)
  const [priceBLoading, setPriceBLoading] = useState(false)
  const initialSlippage = localStorage.getItem('INVARIANT_NEW_POSITION_SLIPPAGE') ?? '1'

  const calcAmount = (amount: BN, tokenAddress: PublicKey) => {
    if (tokenAIndex === null || tokenBIndex === null || poolIndex === null) {
      return new BN(0)
    }

    const byX = tokenAddress.equals(
      isXtoY ? tokens[tokenAIndex].assetAddress : tokens[tokenBIndex].assetAddress
    )

    try {
      if (byX) {
        const result = getLiquidityByX(
          amount,
          getMinTick(tickSpacing),
          getMaxTick(tickSpacing),
          allPools[poolIndex].sqrtPrice,
          true
        )
        if (isMountedRef.current) {
          liquidityRef.current = result.liquidity
        }
        return result.y
      }
      const result = getLiquidityByY(
        amount,
        getMinTick(tickSpacing),
        getMaxTick(tickSpacing),
        allPools[poolIndex].sqrtPrice,
        true
      )
      if (isMountedRef.current) {
        liquidityRef.current = result.liquidity
      }
      return result.x
    } catch (error) {
      const result = (byX ? getLiquidityByY : getLiquidityByX)(
        amount,
        getMinTick(tickSpacing),
        getMaxTick(tickSpacing),
        allPools[poolIndex].sqrtPrice,
        true
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
    if (tokenAIndex !== null && tokenBIndex !== null) {
      return (
        tokens[tokenAIndex].assetAddress.toString() < tokens[tokenBIndex].assetAddress.toString()
      )
    }
    return true
  }, [tokenAIndex, tokenBIndex])

  useEffect(() => {
    if (tokenAIndex !== null && tokenBIndex !== null) {
      dispatch(
        poolsActions.getPoolData(
          new Pair(tokens[tokenAIndex].address, tokens[tokenBIndex].address, FEE_TIERS[feeIndex])
        )
      )
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
      addLiquidityHandler={(xAmount, yAmount) => {}}
      removeLiquidityHandler={(xAmount, yAmount) => {}}
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
      progress={progress}
      isXtoY={true}
      xDecimal={12}
      yDecimal={10}
      tickSpacing={1}
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
      showNoConnected={walletStatus !== Status.Initialized}
      tokenAPriceData={tokenAPriceData}
      tokenBPriceData={tokenBPriceData}
      priceALoading={priceALoading}
      priceBLoading={priceBLoading}
    />
  )
}

export default LiquidityWrapper
