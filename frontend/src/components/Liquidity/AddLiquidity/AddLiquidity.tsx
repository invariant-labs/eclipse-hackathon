import AnimatedButton, { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import DepositAmountInput from '@components/Inputs/DepositAmountInput/DepositAmountInput'
import { Grid, Typography } from '@mui/material'
import classNames from 'classnames'
import React, { useCallback } from 'react'
import useStyles from '../style'
import { SwapToken } from '@store/selectors/wallet'
import { printBN, printBNtoBN } from '@utils/utils'
import { PublicKey } from '@solana/web3.js'
import {
  LPTokenDecimals,
  WETH_MIN_DEPOSIT_SWAP_FROM_AMOUNT,
  WETH_POOL_INIT_LAMPORTS,
  WRAPPED_ETH_ADDRESS
} from '@store/consts/static'
import { BN } from '@project-serum/anchor'
import InputInfo from '../../Inputs/InfoInput/InfoInput'

export interface InputState {
  value: string
  setValue: (value: string) => void
  decimalsLimit: number
}

export interface IAddLiquidity {
  tokens: SwapToken[]
  onAddLiquidity: () => void
  tokenAInputState: InputState
  tokenBInputState: InputState
  tokenAIndex: number | null
  tokenBIndex: number | null
  feeTierIndex: number
  progress: ProgressState
  LPTokenName: string
  LPTokenIcon: string
  LPTokenReceive: string
  priceA?: number
  priceB?: number
  priceALoading?: boolean
  priceBLoading?: boolean
  className?: string
}

export const AddLiquidity: React.FC<IAddLiquidity> = ({
  tokens,
  onAddLiquidity,
  tokenAInputState,
  tokenBInputState,
  tokenAIndex,
  tokenBIndex,
  feeTierIndex,
  progress,
  LPTokenName,
  LPTokenIcon,
  LPTokenReceive,
  priceA,
  priceB,
  priceALoading,
  priceBLoading,
  className
}) => {
  const { classes } = useStyles()

  const getButtonMessage = useCallback(() => {
    if (tokenAIndex === null || tokenBIndex === null) {
      return 'Select tokens'
    }

    if (tokenAIndex === tokenBIndex) {
      return 'Select different tokens'
    }

    if (
      printBNtoBN(tokenAInputState.value, tokens[tokenAIndex].decimals).gt(
        tokens[tokenAIndex].balance
      )
    ) {
      return `Not enough ${tokens[tokenAIndex].symbol}`
    }

    if (
      printBNtoBN(tokenBInputState.value, tokens[tokenBIndex].decimals).gt(
        tokens[tokenBIndex].balance
      )
    ) {
      return `Not enough ${tokens[tokenBIndex].symbol}`
    }

    if (+tokenAInputState.value === 0 || +tokenBInputState.value === 0) {
      return 'Enter token amounts'
    }

    return 'Add Liquidity'
  }, [
    tokenAIndex,
    tokenBIndex,
    tokenAInputState.value,
    tokenBInputState.value,
    tokens,
    feeTierIndex
  ])

  return (
    <Grid container direction='column' className={classNames(classes.tabWrapper, className)}>
      <Typography className={classes.sectionTitle}>Deposit Amount</Typography>
      <Grid container className={classes.sectionWrapper}>
        <DepositAmountInput
          tokenPrice={priceA}
          currency={tokenAIndex !== null ? tokens[tokenAIndex].symbol : null}
          icon={tokenAIndex !== null ? tokens[tokenAIndex].logoURI : ''}
          placeholder='0.0'
          onMaxClick={() => {
            if (tokenAIndex === null) {
              return
            }

            if (tokens[tokenAIndex].assetAddress.equals(new PublicKey(WRAPPED_ETH_ADDRESS))) {
              if (tokenBIndex !== null) {
                tokenAInputState.setValue(
                  printBN(
                    tokens[tokenAIndex].balance.gt(WETH_POOL_INIT_LAMPORTS)
                      ? tokens[tokenAIndex].balance.sub(WETH_POOL_INIT_LAMPORTS)
                      : new BN(0),
                    tokens[tokenAIndex].decimals
                  )
                )

                return
              }

              tokenAInputState.setValue(
                printBN(
                  tokens[tokenAIndex].balance.gt(WETH_MIN_DEPOSIT_SWAP_FROM_AMOUNT)
                    ? tokens[tokenAIndex].balance.sub(WETH_MIN_DEPOSIT_SWAP_FROM_AMOUNT)
                    : new BN(0),
                  tokens[tokenAIndex].decimals
                )
              )

              return
            }
            tokenAInputState.setValue(
              printBN(tokens[tokenAIndex].balance, tokens[tokenAIndex].decimals)
            )
          }}
          balanceValue={
            tokenAIndex !== null
              ? printBN(tokens[tokenAIndex].balance, tokens[tokenAIndex].decimals)
              : ''
          }
          style={{
            marginBottom: 10
          }}
          onBlur={() => {
            if (
              tokenAIndex !== null &&
              tokenBIndex !== null &&
              tokenAInputState.value.length === 0
            ) {
              tokenAInputState.setValue('0.0')
            }
          }}
          {...tokenAInputState}
          priceLoading={priceALoading}
        />

        <DepositAmountInput
          tokenPrice={priceB}
          currency={tokenBIndex !== null ? tokens[tokenBIndex].symbol : null}
          icon={tokenBIndex !== null ? tokens[tokenBIndex].logoURI : ''}
          placeholder='0.0'
          onMaxClick={() => {
            if (tokenBIndex === null) {
              return
            }

            if (tokens[tokenBIndex].assetAddress.equals(new PublicKey(WRAPPED_ETH_ADDRESS))) {
              if (tokenAIndex !== null) {
                tokenBInputState.setValue(
                  printBN(
                    tokens[tokenBIndex].balance.gt(WETH_POOL_INIT_LAMPORTS)
                      ? tokens[tokenBIndex].balance.sub(WETH_POOL_INIT_LAMPORTS)
                      : new BN(0),
                    tokens[tokenBIndex].decimals
                  )
                )

                return
              }

              tokenBInputState.setValue(
                printBN(
                  tokens[tokenBIndex].balance.gt(WETH_MIN_DEPOSIT_SWAP_FROM_AMOUNT)
                    ? tokens[tokenBIndex].balance.sub(WETH_MIN_DEPOSIT_SWAP_FROM_AMOUNT)
                    : new BN(0),
                  tokens[tokenBIndex].decimals
                )
              )

              return
            }
            tokenBInputState.setValue(
              printBN(tokens[tokenBIndex].balance, tokens[tokenBIndex].decimals)
            )
          }}
          balanceValue={
            tokenBIndex !== null
              ? printBN(tokens[tokenBIndex].balance, tokens[tokenBIndex].decimals)
              : ''
          }
          onBlur={() => {
            if (
              tokenAIndex !== null &&
              tokenBIndex !== null &&
              tokenBInputState.value.length === 0
            ) {
              tokenBInputState.setValue('0.0')
            }
          }}
          {...tokenBInputState}
          priceLoading={priceBLoading}
        />
      </Grid>
      <Typography className={classes.sectionTitle}>Receive Amount</Typography>
      <Grid container className={classes.sectionWrapper}>
        <InputInfo
          currency={LPTokenName}
          icon={
            tokenAIndex !== null && tokenBIndex !== null
              ? {
                  fistIcon: tokens[tokenAIndex].logoURI,
                  secondIcon: tokens[tokenBIndex].logoURI
                }
              : ''
          }
          decimal={LPTokenDecimals}
          value={LPTokenReceive}
        />
      </Grid>
      <AnimatedButton
        className={classNames(
          classes.addButton,
          progress === 'none' ? classes.hoverButton : undefined
        )}
        onClick={() => {
          if (progress === 'none') {
            onAddLiquidity()
          }
        }}
        disabled={getButtonMessage() !== 'Add Liquidity'}
        content={getButtonMessage()}
        progress={progress}
      />
    </Grid>
  )
}

export default AddLiquidity
