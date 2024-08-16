import { Grid } from '@mui/material'
import { useStyles } from './styles'
import comingSoon from '../../static/png/coming-soon.png'

export const StatsPage: React.FC = () => {
  const { classes } = useStyles()

  return (
    <Grid container className={classes.container}>
      <img src={comingSoon} alt='Coming soon icon' />
    </Grid>
  )
}

export default StatsPage
