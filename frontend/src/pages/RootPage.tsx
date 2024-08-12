import React, { useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import EventsHandlers from '@containers/EventsHandlers'
import FooterWrapper from '@containers/FooterWrapper'
import HeaderWrapper from '@containers/HeaderWrapper/HeaderWrapper'
import { Grid } from '@mui/material'
import { toBlur } from '@utils/uiUtils'
import useStyles from './style'

const RootPage: React.FC = React.memo(() => {
  const {classes} = useStyles()
  const dispatch = useDispatch()
  // const signerStatus = useSelector(solanaConnectionSelector.status)
  // const walletStatus = useSelector(status)

  // useEffect(() => {
  //   dispatch(solanaConnectionActions.initSolanaConnection())
  // }, [dispatch])

  // useEffect(() => {
  //   if (signerStatus === Status.Initialized && walletStatus === WalletStatus.Initialized) {
  //     dispatch(actions.getPositionsList())
  //   }
  // }, [signerStatus, walletStatus])

  return (
    <>
      {/* {signerStatus === Status.Initialized && <EventsHandlers />} */}
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
