import { Provider } from 'react-redux'
import { store } from './store'
import { RouterProvider } from 'react-router-dom'
import { router } from '@pages/RouterPages'
import SnackbarProvider from '@components/Snackbar'
import { theme } from '@static/theme'
import { ThemeProvider } from '@mui/material/styles'
import Notifier from '@containers/Notifier'
import { PersistGate } from 'redux-persist/integration/react'
import { persistStore } from 'redux-persist'

function App() {
  const persistor = persistStore(store)

  return (
    <>
      <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={theme}>
          <SnackbarProvider maxSnack={99}>
            <>
              <Notifier />
              <RouterProvider router={router} />
            </>
          </SnackbarProvider>
        </ThemeProvider>
        </PersistGate>
      </Provider>
    </>
  )
}

export default App
