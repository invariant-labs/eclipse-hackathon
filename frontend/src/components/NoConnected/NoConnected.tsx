import { Button, Grid, Typography } from '@mui/material'
import icons from '@static/icons'
import classNames from 'classnames'
import { useStyles } from './style'

export interface INoConnected {
  onConnect: () => void
  descCustomText?: string
}

export const NoConnected: React.FC<INoConnected> = ({ onConnect, descCustomText }) => {
  const { classes } = useStyles()

  return (
    <Grid container>
      <Grid className={classNames(classes.blur, 'blurLayer')} />
      <Grid className={classNames(classes.container, 'blurLayer')}>
        <Grid className={classNames(classes.root, 'blurInfo')}>
          <img className={classes.img} src={icons.NoConnected} alt='Not connected' />
          <Typography className={classes.desc}>Wallet is not connected.</Typography>
          {descCustomText?.length && (
            <Typography className={classes.desc}>{descCustomText}</Typography>
          )}
          <Button className={classes.button} onClick={onConnect} variant='contained'>
            Connect a wallet
          </Button>
        </Grid>
      </Grid>
    </Grid>
  )
}
