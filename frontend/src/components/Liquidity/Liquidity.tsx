import { Button, Grid, Typography } from '@mui/material'
import { SwapToken } from '@store/selectors/wallet'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStyles from './style'
import { FormatNumberThreshold, TokenPriceData } from '@store/consts/types'
import { TooltipHover } from '@components/TooltipHover/TooltipHover'
import { INoConnected, NoConnected } from '@components/NoConnected/NoConnected'
import { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import { ALL_FEE_TIERS_DATA, BestTier } from '@store/consts/static'
import {
  parseFeeToPathFee,
  parsePathFeeToFeeString,
  printBN,
  printBNtoBN,
  tickerToAddress,
  trimLeadingZeros
} from '@utils/utils'
import { BN } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import AddLiquidity from './AddLiquidity/AddLiquidity'
import RemoveLiquidity from './RemoveLiquidity/RemoveLiquidity'
import classNames from 'classnames'
import FeeSwitch from './FeeSwitch/FeeSwitch'
import Select from '@components/Inputs/Select/Select'
import SwapList from '@static/svg/swap-list.svg'

export interface ILiquidity {
  initialTokenFrom: string
  initialTokenTo: string
  initialFee: string
  initialTab: string
  tokens: SwapToken[]
  midPrice: any
  setMidPrice: (mid: any) => void
  addLiquidityHandler: (xAmount: number, yAmount: number) => void
  removeLiquidityHandler: (xAmount: number, yAmount: FormatNumberThreshold) => void
  onChangePositionTokens: (
    tokenAIndex: number | null,
    tokenBindex: number | null,
    feeTierIndex: number
  ) => void
  calcAmount: (amount: BN, tokenAddress: PublicKey) => BN
  feeTiers: Array<{
    feeValue: number
  }>
  noConnectedBlockerProps: INoConnected
  progress: ProgressState

  isXtoY: boolean
  xDecimal: number
  yDecimal: number
  tickSpacing: number
  isWaitingForNewPool: boolean
  poolIndex: number | null
  bestTiers: BestTier[]
  canCreateNewPool: boolean
  handleAddToken: (address: string) => void
  commonTokens: PublicKey[]
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  reloadHandler: () => void
  currentFeeIndex: number
  setCurrentFeeIndex: (index: number) => void
  showNoConnected?: boolean
  tokenAPriceData?: TokenPriceData
  tokenBPriceData?: TokenPriceData
  priceALoading?: boolean
  priceBLoading?: boolean
}

export const Liquidity: React.FC<ILiquidity> = ({
  initialTokenFrom,
  initialTokenTo,
  initialFee,
  initialTab,
  tokens,
  // setMidPrice,
  // addLiquidityHandler,
  // removeLiquidityHandler,
  onChangePositionTokens,
  calcAmount,
  feeTiers,
  noConnectedBlockerProps,
  progress,
  // isXtoY,
  // xDecimal,
  // yDecimal,
  // tickSpacing,
  // isWaitingForNewPool,
  poolIndex,
  bestTiers,
  // canCreateNewPool,
  handleAddToken,
  commonTokens,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  // reloadHandler,
  currentFeeIndex,
  setCurrentFeeIndex,
  showNoConnected = false,
  tokenAPriceData,
  tokenBPriceData,
  priceALoading,
  priceBLoading
}) => {
  const { classes } = useStyles()
  const navigate = useNavigate()

  const [isAddLiquidity, setIsAddLiquidity] = useState<boolean>(true)

  const [tokenAIndex, setTokenAIndex] = useState<number | null>(null)
  const [tokenBIndex, setTokenBIndex] = useState<number | null>(null)

  const [tokenADeposit, setTokenADeposit] = useState<string>('')
  const [tokenBDeposit, setTokenBDeposit] = useState<string>('')
  const [LPTokenDeposit, setLPTokenDeposit] = useState<string>('')

  // const [tokenAReceive, setTokenAReceive] = useState<string>('')
  // const [tokenBReceive, setTokenBReceive] = useState<string>('')
  // const [LPTokenReceive, setLPTokenReceive] = useState<string>('')

  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  useEffect(() => {
    if (isLoaded || tokens.length === 0 || ALL_FEE_TIERS_DATA.length === 0) {
      return
    }

    let tokenAIndexFromPath = null
    let tokenBIndexFromPath = null
    let feeTierIndexFromPath = 0

    tokens.forEach((token, index) => {
      if (token.assetAddress.toString() === tickerToAddress(initialTokenFrom)) {
        tokenAIndexFromPath = index
      }

      if (token.assetAddress.toString() === tickerToAddress(initialTokenTo)) {
        tokenBIndexFromPath = index
      }
    })

    const parsedFee = parsePathFeeToFeeString(initialFee)

    ALL_FEE_TIERS_DATA.forEach((feeTierData, index) => {
      if (feeTierData.tier.fee.toString() === parsedFee) {
        feeTierIndexFromPath = index
      }
    })

    setTokenAIndex(tokenAIndexFromPath)
    setTokenBIndex(tokenBIndexFromPath)
    setIsAddLiquidity(initialTab !== 'remove')

    setCurrentFeeIndex(feeTierIndexFromPath)

    setIsLoaded(true)
  }, [tokens])

  const lpTokenName = useMemo(() => {
    if (tokenAIndex === null || tokenBIndex === null) {
      return null
    }
    const parsedFee = parseFeeToPathFee(ALL_FEE_TIERS_DATA[currentFeeIndex].tier.fee)
    return tokens[tokenAIndex].symbol + '-' + tokens[tokenBIndex].symbol + '-' + parsedFee
  }, [tokenAIndex, tokenBIndex, currentFeeIndex])

  const getOtherTokenAmount = (amount: BN, byFirst: boolean) => {
    const printIndex = byFirst ? tokenBIndex : tokenAIndex
    const calcIndex = byFirst ? tokenAIndex : tokenBIndex
    if (printIndex === null || calcIndex === null) {
      return '0.0'
    }

    const result = calcAmount(amount, tokens[calcIndex].assetAddress)

    return trimLeadingZeros(printBN(result, tokens[printIndex].decimals))
  }

  const bestTierIndex =
    tokenAIndex === null || tokenBIndex === null
      ? undefined
      : (bestTiers.find(
          tier =>
            (tier.tokenX.equals(tokens[tokenAIndex].assetAddress) &&
              tier.tokenY.equals(tokens[tokenBIndex].assetAddress)) ||
            (tier.tokenX.equals(tokens[tokenBIndex].assetAddress) &&
              tier.tokenY.equals(tokens[tokenAIndex].assetAddress))
        )?.bestTierIndex ?? undefined)

  const updatePath = (
    index1: number | null,
    index2: number | null,
    fee: number,
    isAdd: boolean
  ) => {
    const parsedFee = parseFeeToPathFee(ALL_FEE_TIERS_DATA[fee].tier.fee)
    const tab = isAdd ? 'add' : 'remove'

    if (index1 !== null && index2 !== null) {
      const token1Symbol = tokens[index1].symbol
      const token2Symbol = tokens[index2].symbol
      navigate(`/liquidity/${tab}/${token1Symbol}/${token2Symbol}/${parsedFee}`, { replace: true })
    } else if (index1 !== null) {
      const tokenSymbol = tokens[index1].symbol
      navigate(`/liquidity/${tab}/${tokenSymbol}/${parsedFee}`, { replace: true })
    } else if (index2 !== null) {
      const tokenSymbol = tokens[index2].symbol
      navigate(`/liquidity/${tab}/${tokenSymbol}/${parsedFee}`, { replace: true })
    } else if (fee) {
      navigate(`/liquidity/${tab}/${parsedFee}`, { replace: true })
    } else if (tab) {
      navigate(`/liquidity/${tab}`, { replace: true })
    }
  }
  const setPositionTokens = (
    index1: number | null,
    index2: number | null,
    fee: number,
    isAdd: boolean
  ) => {
    setTokenAIndex(index1)
    setTokenBIndex(index2)
    onChangePositionTokens(index1, index2, fee)

    updatePath(index1, index2, fee, isAdd)
  }

  const [lastInput, setLastInput] = useState<'A' | 'B'>('A')

  useEffect(() => {
    if (tokenAIndex !== null && tokenBIndex !== null) {
      if (lastInput === 'A') {
        const result = getOtherTokenAmount(
          printBNtoBN(tokenADeposit, tokens[tokenAIndex].decimals),
          true
        )
        setTokenBDeposit(result)
      } else {
        const result = getOtherTokenAmount(
          printBNtoBN(tokenBDeposit, tokens[tokenBIndex].decimals),
          false
        )
        setTokenADeposit(result)
      }
    }
  }, [poolIndex])

  return (
    <Grid container className={classes.wrapper} direction='column'>
      {showNoConnected && <NoConnected {...noConnectedBlockerProps} />}
      <Grid
        container
        justifyContent='space-between'
        alignItems='center'
        className={classes.tabsContainer}>
        <Button
          className={classNames(classes.tabButton, isAddLiquidity ? classes.activeTab : null)}
          onClick={() => {
            setIsAddLiquidity(true)
            setPositionTokens(tokenAIndex, tokenBIndex, currentFeeIndex, true)
          }}>
          <Typography className={classes.tab}>Add Liquidity</Typography>
        </Button>
        <Button
          className={classNames(classes.tabButton, isAddLiquidity ? null : classes.activeTab)}
          onClick={() => {
            setIsAddLiquidity(false)
            setPositionTokens(tokenAIndex, tokenBIndex, currentFeeIndex, false)
          }}>
          <Typography className={classes.tab}>Remove Liquidity</Typography>
        </Button>
      </Grid>
      <Grid className={classes.background}>
        <Grid container className={classes.sectionWrapper}>
          <Grid
            container
            className={classes.selects}
            direction='row'
            justifyContent='space-between'>
            <Grid className={classes.selectWrapper}>
              <Select
                tokens={tokens}
                current={tokenAIndex !== null ? tokens[tokenAIndex] : null}
                onSelect={index => {
                  setTokenAIndex(index)
                  setPositionTokens(index, tokenBIndex, currentFeeIndex, isAddLiquidity)
                }}
                centered
                className={classes.customSelect}
                handleAddToken={handleAddToken}
                sliceName
                commonTokens={commonTokens}
                initialHideUnknownTokensValue={initialHideUnknownTokensValue}
                onHideUnknownTokensChange={onHideUnknownTokensChange}
              />
            </Grid>

            <TooltipHover text='Reverse tokens'>
              <img
                className={classes.arrows}
                src={SwapList}
                alt='Arrow'
                onClick={() => {
                  if (tokenAIndex === null || tokenBIndex === null) {
                    return
                  }

                  if (tokenAIndex !== null) {
                    setTokenBDeposit(tokenADeposit)
                    setTokenADeposit(
                      getOtherTokenAmount(
                        printBNtoBN(tokenADeposit, tokens[tokenAIndex].decimals),
                        false
                      )
                    )
                  } else if (tokenBIndex !== null) {
                    setTokenADeposit(tokenBDeposit)
                    setTokenBDeposit(
                      getOtherTokenAmount(
                        printBNtoBN(tokenBDeposit, tokens[tokenBIndex].decimals),
                        true
                      )
                    )
                  }

                  setTokenBDeposit(tokenADeposit)
                  setTokenADeposit(tokenBDeposit)

                  const pom = tokenAIndex
                  setTokenAIndex(tokenBIndex)
                  setTokenBIndex(pom)
                  onChangePositionTokens(tokenBIndex, tokenAIndex, currentFeeIndex)

                  updatePath(tokenBIndex, tokenAIndex, currentFeeIndex, isAddLiquidity)
                }}
              />
            </TooltipHover>

            <Grid className={classes.selectWrapper}>
              <Select
                tokens={tokens}
                current={tokenBIndex !== null ? tokens[tokenBIndex] : null}
                onSelect={index => {
                  setTokenBIndex(index)
                  setPositionTokens(tokenAIndex, index, currentFeeIndex, isAddLiquidity)
                }}
                centered
                className={classes.customSelect}
                handleAddToken={handleAddToken}
                sliceName
                commonTokens={commonTokens}
                initialHideUnknownTokensValue={initialHideUnknownTokensValue}
                onHideUnknownTokensChange={onHideUnknownTokensChange}
              />
            </Grid>
          </Grid>

          <FeeSwitch
            onSelect={fee => {
              setPositionTokens(tokenAIndex, tokenBIndex, fee, isAddLiquidity)
            }}
            feeTiers={feeTiers.map(tier => tier.feeValue)}
            showOnlyPercents
            bestTierIndex={bestTierIndex}
            currentValue={currentFeeIndex}
          />
        </Grid>
        <Grid container className={classes.row} alignItems='stretch'>
          {isAddLiquidity ? (
            <AddLiquidity
              tokens={tokens}
              onAddLiquidity={() => {
                //TODO
              }}
              tokenAInputState={{
                value: tokenADeposit,
                setValue: value => {
                  if (tokenAIndex === null) {
                    return
                  }
                  setLastInput('A')
                  setTokenADeposit(value)
                  setTokenBDeposit(
                    getOtherTokenAmount(printBNtoBN(value, tokens[tokenAIndex].decimals), true)
                  )
                },
                decimalsLimit: tokenAIndex !== null ? tokens[tokenAIndex].decimals : 0
              }}
              tokenBInputState={{
                value: tokenBDeposit,
                setValue: value => {
                  if (tokenBIndex === null) {
                    return
                  }
                  setLastInput('B')
                  setTokenBDeposit(value)
                  setTokenADeposit(
                    getOtherTokenAmount(printBNtoBN(value, tokens[tokenBIndex].decimals), false)
                  )
                },
                decimalsLimit: tokenBIndex !== null ? tokens[tokenBIndex].decimals : 0
              }}
              tokenAIndex={tokenAIndex}
              tokenBIndex={tokenBIndex}
              feeTierIndex={currentFeeIndex}
              progress={progress}
              LPTokenName={lpTokenName ?? ''}
              LPTokenReceive={''}
              priceA={tokenAPriceData?.price}
              priceB={tokenBPriceData?.price}
              priceALoading={priceALoading}
              priceBLoading={priceBLoading}
            />
          ) : (
            <RemoveLiquidity
              tokens={tokens}
              onRemoveLiquidity={() => {
                //TODO
              }}
              LPTokenInputState={{
                value: LPTokenDeposit,
                setValue: value => {
                  setLPTokenDeposit(value)
                },
                decimalsLimit: tokenAIndex !== null ? tokens[tokenAIndex].decimals : 0
              }}
              tokenAIndex={tokenAIndex}
              tokenBIndex={tokenBIndex}
              feeTierIndex={currentFeeIndex}
              progress={progress}
              LPTokenName={lpTokenName ?? ''}
              LPTokenBalance={new BN(0)}
              tokenAReceive={''}
              tokenBReceive={''}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Liquidity
