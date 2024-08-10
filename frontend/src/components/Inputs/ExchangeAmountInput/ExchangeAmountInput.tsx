import Select from '@components/Inputs/Select/Select'
import { OutlinedButton } from '@components/OutlinedButton/OutlinedButton'
import { Grid, Input, Tooltip, Typography } from '@mui/material'
import loadingAnimation from '@static/gif/loading.gif'
import { formatNumber } from '@utils/utils'
import { SwapToken } from '@store/selectors/wallet'
import classNames from 'classnames'
import React, { CSSProperties, useRef } from 'react'
import useStyles from './style'

interface IProps {
  setValue: (value: string) => void
  value?: string
  error?: string | null
  className?: string
  decimal: bigint
  placeholder?: string
  style?: CSSProperties
  onMaxClick: () => void
  current: SwapToken | null
  tokens: Record<string, SwapToken>
  onSelect: (address: string) => void
  disabled: boolean
  balance?: string
  hideBalances?: boolean
  handleAddToken: (address: string) => void
  commonTokens: string[]
  limit?: number
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  percentageChange?: number
  tokenPrice?: number
  priceLoading?: boolean
  isBalanceLoading: boolean
  showMaxButton: boolean
  showBlur: boolean
}

export const AmountInput: React.FC<IProps> = ({
  value,
  setValue,
  error,
  className,
  decimal,
  placeholder,
  style,
  onMaxClick,
  current,
  tokens,
  onSelect,
  disabled,
  balance,
  hideBalances = false,
  handleAddToken,
  commonTokens,
  limit,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  tokenPrice,
  priceLoading = false,
  isBalanceLoading,
  showMaxButton = true,
  showBlur
}) => {
  const hideBalance = balance === '- -' || !balance || hideBalances
  const { classes } = useStyles({ walletDisconnected: hideBalance })
  const inputRef = useRef<HTMLInputElement>(null)

  const allowOnlyDigitsAndTrimUnnecessaryZeros: React.ChangeEventHandler<HTMLInputElement> = e => {
    const onlyNumbersRegex = /^\d*\.?\d*$/
    const trimDecimal = `^\\d*\\.?\\d{0,${decimal}}$`
    const regex = new RegExp(trimDecimal, 'g')
    if (e.target.value === '' || regex.test(e.target.value)) {
      if ((typeof limit !== 'undefined' && +e.target.value > limit) || disabled) {
        return
      }

      const startValue = e.target.value
      const caretPosition = e.target.selectionStart

      let parsed = e.target.value

      const dotRegex = /^\.\d*$/
      if (dotRegex.test(parsed)) {
        parsed = `0${parsed}`
      }

      const diff = startValue.length - parsed.length

      setValue(parsed)
      if (caretPosition !== null && parsed !== startValue) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = Math.max(caretPosition - diff, 0)
            inputRef.current.selectionEnd = Math.max(caretPosition - diff, 0)
          }
        }, 0)
      }
    } else if (!onlyNumbersRegex.test(e.target.value)) {
      setValue('')
    } else if (!regex.test(e.target.value)) {
      setValue(e.target.value.slice(0, e.target.value.length - 1))
    }
  }

  const tokenIcon = !current ? '' : current.symbol

  const usdBalance = tokenPrice && balance ? tokenPrice * +balance : 0

  return (
    <>
      <Grid container alignItems='center' wrap='nowrap' className={classes.exchangeContainer}>
        <Select
          centered={true}
          tokens={tokens}
          onSelect={onSelect}
          current={current}
          className={classes.select}
          hideBalancesInModal={hideBalances}
          handleAddToken={handleAddToken}
          commonTokens={commonTokens}
          initialHideUnknownTokensValue={initialHideUnknownTokensValue}
          onHideUnknownTokensChange={onHideUnknownTokensChange}
        />
        {showBlur ? (
          <div className={classes.blur}></div>
        ) : (
          <Input
            inputRef={inputRef}
            error={!!error}
            className={classNames(classes.amountInput, className)}
            classes={{ input: classes.input }}
            style={style}
            value={value}
            disableUnderline={true}
            placeholder={placeholder}
            onChange={allowOnlyDigitsAndTrimUnnecessaryZeros}
            inputProps={{
              inputMode: 'decimal'
            }}
          />
        )}
      </Grid>
      {!hideBalance && (
        <Grid
          container
          justifyContent='space-between'
          alignItems='center'
          direction='row'
          wrap='nowrap'
          className={classes.bottom}>
          <Grid
            className={classNames(classes.balanceContainer, {
              [classes.showMaxButton]: showMaxButton
            })}
            onClick={showMaxButton ? onMaxClick : () => {}}>
            <Typography className={classes.BalanceTypography}>
              Balance:{' '}
              {isBalanceLoading ? (
                <img src={loadingAnimation} className={classes.loadingBalance} alt='loading' />
              ) : (
                formatNumber(balance || 0)
              )}{' '}
              {tokenIcon.slice(0, 8)}
              {tokenIcon.length > 8 ? '...' : ''}
            </Typography>
            {showMaxButton && (
              <OutlinedButton
                name='Max'
                color='primary'
                onClick={onMaxClick}
                className={classes.maxButton}
                labelClassName={classes.label}
                disabled={
                  disabled && isNaN(Number(balance))
                    ? disabled
                    : isNaN(Number(balance)) || hideBalances
                }
              />
            )}
          </Grid>
          <Grid className={classes.percentages} container alignItems='center' wrap='nowrap'>
            {current ? (
              priceLoading ? (
                <img src={loadingAnimation} className={classes.loading} alt='loading' />
              ) : tokenPrice ? (
                <>
                  <Typography className={classes.caption2}>
                    ~${formatNumber(usdBalance.toFixed(2))}
                  </Typography>
                </>
              ) : (
                <Tooltip
                  enterTouchDelay={0}
                  leaveTouchDelay={Number.MAX_SAFE_INTEGER}
                  title='Cannot fetch price of token'
                  placement='bottom'
                  classes={{
                    tooltip: classes.tooltip
                  }}>
                  <Typography className={classes.noData}>
                    <span className={classes.noDataIcon}>?</span>No data
                  </Typography>
                </Tooltip>
              )
            ) : null}
          </Grid>
        </Grid>
      )}
    </>
  )
}
export default AmountInput
