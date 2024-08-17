import AnimatedButton, { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import DepositAmountInput from '@components/Inputs/DepositAmountInput/DepositAmountInput'
import { Grid, Typography } from '@mui/material'
import classNames from 'classnames'
import React, { useCallback } from 'react'
import useStyles from '../style'
import { SwapToken } from '@store/selectors/wallet'
import { printBN, printBNtoBN } from '@utils/utils'

import { LPTokenDecimals } from '@store/consts/static'
import { BN } from '@project-serum/anchor'

import InputInfo from '../../Inputs/InfoInput/InfoInput'

export interface InputState {
  value: string
  setValue: (value: string) => void
  decimalsLimit: number
}

export interface IRemoveLiquidity {
  tokens: SwapToken[]
  onRemoveLiquidity: () => void
  LPTokenInputState: InputState
  tokenAIndex: number | null
  tokenBIndex: number | null
  feeTierIndex: number
  progress: ProgressState
  LPTokenName: string
  LPTokenBalance: BN
  LPTokenIcon: string
  tokenAReceive: string
  tokenBReceive: string
  className?: string
}

export const RemoveLiquidity: React.FC<IRemoveLiquidity> = ({
  tokens,
  onRemoveLiquidity,
  LPTokenInputState,
  tokenAIndex,
  tokenBIndex,
  feeTierIndex,
  progress,
  LPTokenName,
  LPTokenBalance,
  LPTokenIcon,
  tokenAReceive,
  tokenBReceive,
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

    if (printBNtoBN(LPTokenInputState.value, LPTokenDecimals).gt(LPTokenBalance)) {
      return `Not enough ${LPTokenName}`
    }

    if (+LPTokenInputState.value === 0) {
      return 'Enter token amount'
    }

    return 'Remove Liquidity'
  }, [tokenAIndex, tokenBIndex, LPTokenInputState.value, tokens, feeTierIndex])

  return (
    <Grid container direction='column' className={classNames(classes.tabWrapper, className)}>
      <Typography className={classes.sectionTitle}>Remove Amount</Typography>
      <Grid container className={classes.sectionWrapper}>
        <DepositAmountInput
          currency={LPTokenName}
          icon={
            tokenAIndex !== null && tokenBIndex !== null
              ? {
                  fistIcon: tokens[tokenAIndex].logoURI,
                  secondIcon: tokens[tokenBIndex].logoURI
                }
              : ''
          }
          placeholder='0.0'
          onMaxClick={() => {
            // if (tokens[tokenAIndex].assetAddress.equals(new PublicKey(WRAPPED_ETH_ADDRESS))) {
            //   if (tokenBIndex !== null) {
            //     tokenAInputState.setValue(
            //       printBN(
            //         tokens[tokenAIndex].balance.gt(WETH_POOL_INIT_LAMPORTS)
            //           ? tokens[tokenAIndex].balance.sub(WETH_POOL_INIT_LAMPORTS)
            //           : new BN(0),
            //         tokens[tokenAIndex].decimals
            //       )
            //     )

            //     return
            //   }

            //   tokenAInputState.setValue(
            //     printBN(
            //       tokens[tokenAIndex].balance.gt(WETH_MIN_DEPOSIT_SWAP_FROM_AMOUNT)
            //         ? tokens[tokenAIndex].balance.sub(WETH_MIN_DEPOSIT_SWAP_FROM_AMOUNT)
            //         : new BN(0),
            //       tokens[tokenAIndex].decimals
            //     )
            //   )

            //   return
            // }
            LPTokenInputState.setValue(printBN(LPTokenBalance, LPTokenDecimals))
          }}
          balanceValue={tokenAIndex !== null ? printBN(LPTokenBalance, LPTokenDecimals) : ''}
          style={{
            marginBottom: 10
          }}
          onBlur={() => {
            if (LPTokenInputState.value.length === 0) {
              LPTokenInputState.setValue('0.0')
            }
          }}
          showEstimatedValue={false}
          columnMobile
          {...LPTokenInputState}
        />
      </Grid>
      <Typography className={classes.sectionTitle}>Receive Amount</Typography>
      <Grid container className={classes.sectionWrapper} rowGap={1}>
        <InputInfo
          currency={tokenAIndex !== null ? tokens[tokenAIndex].symbol : ''}
          icon={tokenAIndex !== null ? tokens[tokenAIndex].logoURI : ''}
          decimal={tokenAIndex !== null ? tokens[tokenAIndex].decimals : 0}
          value={tokenAReceive}
        />
        <InputInfo
          currency={tokenBIndex !== null ? tokens[tokenBIndex].symbol : ''}
          icon={tokenBIndex !== null ? tokens[tokenBIndex].logoURI : ''}
          decimal={tokenBIndex !== null ? tokens[tokenBIndex].decimals : 0}
          value={tokenBReceive}
        />
      </Grid>
      <AnimatedButton
        className={classNames(
          classes.addButton,
          progress === 'none' ? classes.hoverButton : undefined
        )}
        onClick={() => {
          if (progress === 'none') {
            onRemoveLiquidity()
          }
        }}
        disabled={getButtonMessage() !== 'Remove Position'}
        content={getButtonMessage()}
        progress={progress}
      />
    </Grid>
  )
}

export default RemoveLiquidity
