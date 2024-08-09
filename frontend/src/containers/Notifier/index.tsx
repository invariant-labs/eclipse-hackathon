import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSnackbar } from 'notistack'
import { snackbarsSelectors } from '@store/selectors/snackbars'
import { actions } from '@store/reducers/snackbars'
import useStyles from './style'

let displayed: string[] = []

const Notifier = () => {
  const dispatch = useDispatch()
  const notifications = useSelector(snackbarsSelectors.snackbars)
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const { classes } = useStyles()

  const storeDisplayed = (id: string) => {
    displayed = [...displayed, id]
  }

  const removeDisplayed = (id: string) => {
    displayed = [...displayed.filter(key => id !== key)]
  }

  React.useEffect(() => {
    notifications.forEach(({ key = '', message, open, variant, txid, persist = true, link }) => {
      if (!open) {
        // dismiss snackbar using notistack
        closeSnackbar(key)
        return
      }
      // do nothing if snackbar is already displayed
      if (key && displayed.includes(key)) return

      enqueueSnackbar(message, {
        key,
        variant: variant,
        persist: persist,
        onExited: (_event, myKey) => {
          dispatch(actions.remove(myKey as string))
          removeDisplayed(myKey as string)
        },
        txid: txid,
        snackbarId: key,
        link: link
      })
      storeDisplayed(key)
    })
  }, [notifications, closeSnackbar, enqueueSnackbar, dispatch, classes])

  return null
}

export default Notifier
