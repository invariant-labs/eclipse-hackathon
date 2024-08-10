import { Grid } from '@mui/material'
import { useStyles } from './styles'
import workInProgress from '../../static/png/work-in-progress.png'

export const StatsPage: React.FC = () => {
  const { classes } = useStyles()

  return (
    <Grid container className={classes.container}>
      <img src={workInProgress} alt='Work in progress icon' />
    </Grid>
  )
}

export default StatsPage
