import { Grid, Typography, useMediaQuery } from '@mui/material'
import loader from '@static/gif/loading2.gif'
import { formatNumbers, showPrefix } from '@utils/utils'
import React, { useMemo } from 'react'
import useStyles from './style'
import { FormatNumberThreshold, PrefixConfig } from '@store/consts/types'
import { theme } from '@static/theme'

const InputInfo: React.FC<{
  currency: string
  icon: string | { fistIcon: string; secondIcon: string }
  decimal: number
  value: string
  showLoader?: boolean
  columnMobile?: boolean
}> = ({ currency, icon, decimal, value, showLoader = false, columnMobile }) => {
  const { classes } = useStyles()

  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'))
  const columnDirection = useMemo(() => {
    return columnMobile && isSmDown
  }, [isSmDown, columnMobile])

  const thresholdsWithTokenDecimal = (decimals: number): FormatNumberThreshold[] => [
    {
      value: 10,
      decimals
    },
    {
      value: 10000,
      decimals: 6
    },
    {
      value: 100000,
      decimals: 4
    },
    {
      value: 1000000,
      decimals: 3
    },
    {
      value: 1000000000,
      decimals: 2,
      divider: 1000000
    },
    {
      value: Infinity,
      decimals: 2,
      divider: 1000000000
    }
  ]

  const prefixConfig: PrefixConfig = {
    B: 1000000000,
    M: 1000000
  }

  const tokenValue = Math.abs(Number(value)) < 10 ** Number(-decimal) ? 0 : Number(value)

  return (
    <Grid container>
      {showLoader ? (
        <Grid container className={classes.cover}>
          <img src={loader} className={classes.loader} alt='Loader' />
        </Grid>
      ) : null}
      <Grid className={classes.tokenArea}>
        <Grid
          className={classes.tokenAreaUpperPart}
          flexDirection={columnDirection ? 'column' : 'row'}
          rowGap={1}>
          <Grid
            className={classes.currency}
            container
            justifyContent='center'
            alignItems='center'
            wrap='nowrap'
            width={columnDirection ? '100%' : 'fit-content'}>
            {currency !== null && !!icon ? (
              <Grid display='flex' flexDirection='row'>
                {typeof icon === 'string' ? (
                  <img alt='currency icon' src={icon} className={classes.currencyIcon} />
                ) : (
                  <Grid className={classes.iconsGrid}>
                    <img
                      alt='currency first icon'
                      src={icon.fistIcon}
                      className={classes.currencyIcon}
                    />
                    <img
                      alt='currency second icon'
                      src={icon.secondIcon}
                      className={classes.currencyIcon}
                      style={{ transform: 'translateX(-16px)' }}
                    />
                  </Grid>
                )}
                <Grid item>
                  <Typography className={classes.currencySymbol} width='100%'>
                    {currency}
                  </Typography>
                </Grid>
              </Grid>
            ) : (
              <Grid display='flex'>
                <Typography className={classes.noCurrencyText}>-</Typography>
              </Grid>
            )}
          </Grid>
          <Typography
            className={classes.tokenValue}
            style={{ alignSelf: columnDirection ? 'start' : 'center' }}>
            {formatNumbers(thresholdsWithTokenDecimal(Number(decimal)))(`${tokenValue}`)}
            {showPrefix(tokenValue, prefixConfig)}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default InputInfo
