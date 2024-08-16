import { Grid, Typography } from '@mui/material'
import loader from '@static/gif/loading2.gif'
import { formatNumbers, showPrefix } from '@utils/utils'
import React from 'react'
import useStyles from './style'
import { FormatNumberThreshold, PrefixConfig } from '@store/consts/types'

const InputInfo: React.FC<{
  name: string
  icon: string
  decimal: number
  value: string
  showLoader?: boolean
}> = ({ name, icon, decimal, value, showLoader = false }) => {
  const { classes } = useStyles()

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

  const usdThresholds: FormatNumberThreshold[] = [
    {
      value: 1000,
      decimals: 2
    },
    {
      value: 10000,
      decimals: 1
    },
    {
      value: 1000000,
      decimals: 2,
      divider: 1000
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
        <Grid className={classes.tokenAreaUpperPart}>
          <Grid className={classes.token}>
            <img className={classes.iconSmall} src={icon} alt={name} />
            <Typography className={classes.tokenName}>{name}</Typography>
          </Grid>
          <Typography className={classes.tokenValue}>
            {formatNumbers(thresholdsWithTokenDecimal(Number(decimal)))(`${tokenValue}`)}
            {showPrefix(tokenValue, prefixConfig)}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default InputInfo
