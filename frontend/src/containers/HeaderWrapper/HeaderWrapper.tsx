import Header from '@components/Header/Header'
import { NetworkType, RPC } from '@store/consts/static'
import { actions } from '@store/reducers/connection'
import { Status, actions as walletActions } from '@store/reducers/wallet'
import { address, status } from '@store/selectors/wallet'
import { openWalletSelectorModal, nightlyConnectAdapter } from '@utils/web3/selector'
import React, { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { network, rpcAddress } from '@store/selectors/connection'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { getSolanaWallet } from '@utils/web3/wallet'

export const HeaderWrapper: React.FC = () => {
  const dispatch = useDispatch()
  const walletAddress = useSelector(address)
  const walletStatus = useSelector(status)
  const currentNetwork = useSelector(network)
  const currentRpc = useSelector(rpcAddress)
  const location = useLocation()

  useEffect(() => {
    const fetchWallet = async () => {
      const wallet = await getSolanaWallet()

      await nightlyConnectAdapter.canEagerConnect().then(
        async canEagerConnect => {
          if (canEagerConnect) {
            await openWalletSelectorModal()
            dispatch(walletActions.connect(true))
          }
        },
        error => {
          console.log(error)
        }
      )
    }

    fetchWallet()
  }, [])

  const defaultTestnetRPC = useMemo(() => {
    const lastRPC = localStorage.getItem(`INVARIANT_RPC_AlephZero_${currentNetwork}`)

    if (lastRPC === null) {
      localStorage.setItem(`INVARIANT_RPC_AlephZero_${currentNetwork}`, RPC.TEST)
    }

    return lastRPC === null ? RPC.TEST : lastRPC
  }, [])

  return (
    <Header
      address={walletAddress}
      onNetworkSelect={(network, rpcAddress, rpcName) => {
        if (network !== currentNetwork || rpcAddress !== currentRpc) {
          if (network === NetworkType.MAINNET) {
            localStorage.setItem('INVARIANT_MAINNET_RPC', rpcAddress)
          }

          dispatch(actions.setNetwork({ network, rpcAddress, rpcName }))
        }
      }}
      onConnectWallet={async () => {
        await openWalletSelectorModal()
        dispatch(walletActions.connect(false))
      }}
      landing={location.pathname.substring(1)}
      walletConnected={walletStatus === Status.Initialized}
      onDisconnectWallet={() => {
        dispatch(walletActions.disconnect())
      }}
      onFaucet={() => dispatch(walletActions.airdrop())}
      typeOfNetwork={currentNetwork}
      rpc={currentRpc}
      defaultTestnetRPC={defaultTestnetRPC}
      onCopyAddress={() => {
        navigator.clipboard.writeText(walletAddress.toString())

        dispatch(
          snackbarsActions.add({
            message: 'Wallet address copied.',
            variant: 'success',
            persist: false
          })
        )
      }}
      onChangeWallet={() => {
        dispatch(walletActions.reconnect())
      }}
    />
  )
}

export default HeaderWrapper
