import { Grid } from '@mui/material'
import React, { useEffect } from 'react'
import useStyles from './styles'
import { useParams } from 'react-router-dom'
import NewPositionWrapper from '@containers/LiquidityWrapper/LiquidityWrapper'

export interface IProps {}

const LiquidityPage: React.FC<IProps> = () => {
  const { classes } = useStyles()
  const { tab, item1, item2, item3 } = useParams()

  let initialTokenFrom = ''
  let initialTokenTo = ''
  let initialFee = ''
  let initialTab = ''

  if (item3) {
    initialTab = tab || ''
    initialTokenFrom = item1 || ''
    initialTokenTo = item2 || ''
    initialFee = item3
  } else if (item2) {
    initialTab = tab || ''
    initialTokenFrom = item1 || ''
    initialFee = item2
  } else if (item1) {
    initialTab = tab || ''
    initialFee = item1
  } else if (tab) {
    initialTab = tab
  }

  return (
    <Grid container className={classes.container}>
      <Grid item>
        <NewPositionWrapper
          initialTokenFrom={initialTokenFrom}
          initialTokenTo={initialTokenTo}
          initialFee={initialFee}
          initialTab={initialTab}
        />
      </Grid>
    </Grid>
  )
}
export default LiquidityPage
