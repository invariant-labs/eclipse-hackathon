import { PublicKey } from '@solana/web3.js'
import { Status } from '@store/reducers/connection'
import { network,  status } from '@store/selectors/connection'
import { getFullNewTokensData, getNetworkTokensList } from '@utils/utils'
import { getCurrentSolanaConnection } from '@utils/web3/connection'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { actions } from '@store/reducers/pools'

const MarketEvents = () => {
  const dispatch = useDispatch()
  const networkType = useSelector(network)
  // const rpc = useSelector(rpcAddress)
  // const marketProgram = getMarketProgramSync(networkType, rpc)
  // const { tokenFrom, tokenTo } = useSelector(swap)
  const networkStatus = useSelector(status)

  useEffect(() => {
    const connection = getCurrentSolanaConnection()
    if (networkStatus !== Status.Initialized || !connection) {
      return
    }
    const connectEvents = () => {
      let tokens = getNetworkTokensList(networkType)

      const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${networkType}`)
      const currentList: PublicKey[] =
        currentListStr !== null
          ? JSON.parse(currentListStr)
              .filter((address: string) => !tokens[address])
              .map((address: string) => new PublicKey(address))
          : []

      const lastTokenFrom = localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${networkType}`)
      const lastTokenTo = localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${networkType}`)

      if (
        lastTokenFrom !== null &&
        !tokens[lastTokenFrom] &&
        !currentList.find(addr => addr.toString() === lastTokenFrom)
      ) {
        currentList.push(new PublicKey(lastTokenFrom))
      }

      if (
        lastTokenTo !== null &&
        !tokens[lastTokenTo] &&
        !currentList.find(addr => addr.toString() === lastTokenTo)
      ) {
        currentList.push(new PublicKey(lastTokenTo))
      }

      getFullNewTokensData(currentList, connection)
        .then(data => {
          tokens = {
            ...tokens,
            ...data
          }
        })
        .finally(() => {
          dispatch(actions.addTokens(tokens))
        })
    }

    connectEvents()
  }, [dispatch, networkStatus])

  return null
}

export default MarketEvents
