import { useStyles } from './styles'
import { Grid } from '@mui/material'
import comingSoon from '../../static/png/coming-soon.png'
export const SwapPage: React.FC = () => {
  const { classes } = useStyles()

  return (
    <Grid container className={classes.container}>
      <img src={comingSoon} alt='Coming soon icon' />
    </Grid>
  )
}

export default SwapPage
