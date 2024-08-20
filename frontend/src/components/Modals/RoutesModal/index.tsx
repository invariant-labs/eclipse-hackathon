import React from 'react'
import { Link } from 'react-router-dom'
import useStyles from './style'
import { Grid, Popover, Typography } from '@mui/material'

export interface IRoutesModal {
  routes: { root: string; name: string }[]
  open: boolean
  anchorEl: HTMLButtonElement | null
  handleClose: () => void
  onSelect: (selected: string) => void
  current?: string
  onFaucet?: () => void
  onRPC?: () => void
}
export const RoutesModal: React.FC<IRoutesModal> = ({
  routes,
  open,
  anchorEl,
  handleClose,
  onSelect,
  current,
  onFaucet,
  onRPC
}) => {
  const { classes } = useStyles()

  const otherRoutesToHighlight: Record<string, RegExp[]> = {
    liquidity: [/^\/?liquidity(\/(add|remove)(\/[^/]*)*)?$/],
    position: [/^\/?position\/.*$/]
  }

  return (
    <Popover
      classes={{ paper: classes.paper }}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}>
      <Grid className={classes.root} container alignContent='space-around' direction='column'>
        {routes.map(route => (
          <Grid
            item
            key={`routes-${route.root}`}
            className={classes.listItem}
            onClick={() => {
              onSelect(route.root)
              handleClose()
            }}>
            <Link to={`/${route.root}`} className={classes.link}>
              <Typography
                className={
                  current === route.root ||
                  (typeof current !== 'undefined' &&
                    !!otherRoutesToHighlight[route.root] &&
                    otherRoutesToHighlight[route.root].some(pathRegex => pathRegex.test(current)))
                    ? classes.current
                    : classes.name
                }>
                {route.name}
              </Typography>
            </Link>
          </Grid>
        ))}
        {typeof onFaucet !== 'undefined' ? (
          <Grid
            item
            className={classes.listItem}
            onClick={() => {
              onFaucet()
              handleClose()
            }}>
            <Typography className={classes.name}>Faucet</Typography>
          </Grid>
        ) : null}
        {typeof onRPC !== 'undefined' ? (
          <Grid item className={classes.listItem} onClick={onRPC}>
            <Typography className={classes.name}>Set RPC</Typography>
          </Grid>
        ) : null}
      </Grid>
    </Popover>
  )
}
export default RoutesModal
