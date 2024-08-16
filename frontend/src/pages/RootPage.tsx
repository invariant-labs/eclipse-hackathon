import React, { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import EventsHandlers from '@containers/EventsHandlers'
import FooterWrapper from '@containers/FooterWrapper'
import HeaderWrapper from '@containers/HeaderWrapper/HeaderWrapper'
import { Grid } from '@mui/material'
import { toBlur } from '@utils/uiUtils'
import useStyles from './style'
import { Status, actions as connectionActions } from '@store/reducers/connection'
import { status } from '@store/selectors/wallet'

const RootPage: React.FC = React.memo(() => {
  const { classes } = useStyles()

  const dispatch = useDispatch()
  const signerStatus = useSelector(status)

  const navigate = useNavigate()
  const location = useLocation()

  const initConnection = useCallback(() => {
    dispatch(connectionActions.initSolanaConnection())
  }, [dispatch])

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/exchange')
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    initConnection()
  }, [initConnection])
  return (
    <>
      {signerStatus === Status.Initialized && <EventsHandlers />}
      <div id={toBlur}>
        <Grid className={classes.root}>
          <HeaderWrapper />
          <Grid className={classes.body}>
            <Outlet />
          </Grid>
          <FooterWrapper />
        </Grid>
      </div>
    </>
  )
})

export default RootPage
