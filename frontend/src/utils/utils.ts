import { BN } from '@project-serum/anchor'
import { Connection, PublicKey } from '@solana/web3.js'
import {
  BTC_DEV,
  BTC_TEST,
  NetworkType,
  Token,
  USDC_DEV,
  USDC_TEST,
  WETH_DEV,
  addressTickerMap,
  defaultPrefixConfig,
  defaultThresholds
} from '@store/consts/static'
import { FormatNumberThreshold, PrefixConfig } from '@store/consts/types'
import { getMint } from '@solana/spl-token'
import mainnetList from '@store/consts/tokenLists/mainnet.json'
import icons from '@static/icons'
import { getTokenProgramAddress } from '@invariant-labs/sdk-eclipse'
export const createLoaderKey = () => (new Date().getMilliseconds() + Math.random()).toString()

export const trimZeros = (amount: string) => {
  try {
    return parseFloat(amount).toString()
  } catch (error) {
    return amount
  }
}

export const printBN = (amount: BN, decimals: number): string => {
  const amountString = amount.toString()
  const isNegative = amountString.length > 0 && amountString[0] === '-'

  const balanceString = isNegative ? amountString.slice(1) : amountString

  if (balanceString.length <= decimals) {
    return (
      (isNegative ? '-' : '') + '0.' + '0'.repeat(decimals - balanceString.length) + balanceString
    )
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        balanceString.substring(0, balanceString.length - decimals) +
          '.' +
          balanceString.substring(balanceString.length - decimals)
      )
    )
  }
}

export const printBNtoBN = (amount: string, decimals: number): BN => {
  console.log(amount)
  const balanceString = amount.split('.')
  console.log(balanceString)
  if (balanceString.length !== 2) {
    return new BN(balanceString[0] + '0'.repeat(decimals))
  }
  if (balanceString[1].length <= decimals) {
    return new BN(
      balanceString[0] + balanceString[1] + '0'.repeat(decimals - balanceString[1].length)
    )
  }
  return new BN(0)
}
export const formatNumbers =
  (thresholds: FormatNumberThreshold[] = defaultThresholds) =>
  (value: string) => {
    const num = Number(value)
    const abs = Math.abs(num)
    const threshold = thresholds.sort((a, b) => a.value - b.value).find(thr => abs < thr.value)

    const formatted = threshold
      ? (abs / (threshold.divider ?? 1)).toFixed(threshold.decimals)
      : value

    return num < 0 && threshold ? '-' + formatted : formatted
  }

export const showPrefix = (nr: number, config: PrefixConfig = defaultPrefixConfig): string => {
  const abs = Math.abs(nr)

  if (typeof config.B !== 'undefined' && abs >= config.B) {
    return 'B'
  }

  if (typeof config.M !== 'undefined' && abs >= config.M) {
    return 'M'
  }

  if (typeof config.K !== 'undefined' && abs >= config.K) {
    return 'K'
  }

  return ''
}

export const getScaleFromString = (value: string): number => {
  const parts = value.split('.')

  if ((parts?.length ?? 0) < 2) {
    return 0
  }

  return parts[1]?.length ?? 0
}

export const parseFeeToPathFee = (fee: BN): string => {
  const parsedFee = (fee / Math.pow(10, 8)).toString().padStart(3, '0')
  return parsedFee.slice(0, parsedFee.length - 2) + '_' + parsedFee.slice(parsedFee.length - 2)
}

export const trimLeadingZeros = (amount: string): string => {
  console.log(amount)
  const amountParts = amount.split('.')
  console.log(amountParts)

  if (!amountParts.length) {
    return '0'
  }

  if (amountParts.length === 1) {
    return amountParts[0]
  }

  const reversedDec = Array.from(amountParts[1]).reverse()
  const firstNonZero = reversedDec.findIndex(char => char !== '0')

  if (firstNonZero === -1) {
    return amountParts[0]
  }

  const trimmed = reversedDec.slice(firstNonZero, reversedDec.length).reverse().join('')

  return `${amountParts[0]}.${trimmed}`
}

export enum PositionTokenBlock {
  None,
  A,
  B
}

//TODO replace mock calculatePriceSqrt
export const calculatePriceSqrt = (tick: number): BN => {
  console.log(tick)
  return new BN(1)
}

export const determinePositionTokenBlock = (
  currentSqrtPrice: BN,
  lowerTick: number,
  upperTick: number,
  isXtoY: boolean
) => {
  const lowerPrice = calculatePriceSqrt(lowerTick)
  const upperPrice = calculatePriceSqrt(upperTick)

  if (lowerPrice.v.gte(currentSqrtPrice)) {
    return isXtoY ? PositionTokenBlock.B : PositionTokenBlock.A
  }

  if (upperPrice.v.lte(currentSqrtPrice)) {
    return isXtoY ? PositionTokenBlock.A : PositionTokenBlock.B
  }

  return PositionTokenBlock.None
}

export const generateUnknownTokenDataObject = (address: PublicKey, decimals: number): Token => ({
  address,
  decimals,
  symbol: `${address.toString().slice(0, 4)}...${address.toString().slice(-4)}`,
  name: address.toString(),
  logoURI: icons.unknownToken,
  isUnknown: true
})

export const getNewTokenOrThrow = async (
  address: string,
  connection: Connection
): Promise<Record<string, any>> => {
  const key = new PublicKey(address)
  const mintInfo = await getMint(connection, key)

  return {
    [address.toString()]: generateUnknownTokenDataObject(key, mintInfo.decimals)
  }
}

export const addNewTokenToLocalStorage = (address: string, network: NetworkType) => {
  const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${network}`)

  const currentList = currentListStr !== null ? JSON.parse(currentListStr) : []

  currentList.push(address)

  localStorage.setItem(`CUSTOM_TOKENS_${network}`, JSON.stringify([...new Set(currentList)]))
}

export const getNetworkTokensList = (networkType: NetworkType): Record<string, Token> => {
  const obj: Record<string, Token> = {}
  switch (networkType) {
    case NetworkType.MAINNET:
      ;(mainnetList as any[]).forEach(token => {
        obj[token.address] = {
          ...token,
          address: new PublicKey(token.address),
          coingeckoId: token?.extensions?.coingeckoId
        }
      })
      return obj
    case NetworkType.DEVNET:
      return {
        [USDC_DEV.address.toString()]: USDC_DEV,
        [BTC_DEV.address.toString()]: BTC_DEV,
        [WETH_DEV.address.toString()]: WETH_DEV
      }
    case NetworkType.TESTNET:
      return {
        [USDC_TEST.address.toString()]: USDC_TEST,
        [BTC_TEST.address.toString()]: BTC_TEST
        // [WETH_TEST.address.toString()]: WETH_TEST
      }
    default:
      return {}
  }
}

export const getFullNewTokensData = async (
  addresses: PublicKey[],
  connection: Connection
): Promise<Record<string, any>> => {
  const promises = addresses.map(async address => {
    try {
      const mintInfo = await getMint(connection, address)
      return { address, mintInfo }
    } catch (error) {
      return { address, mintInfo: null }
    }
  })

  const tokens: Record<string, any> = {}

  await Promise.allSettled(promises).then(results =>
    results.forEach((result, index) => {
      tokens[addresses[index].toString()] = generateUnknownTokenDataObject(
        addresses[index],
        result.status === 'fulfilled' && result.value.mintInfo ? result.value.mintInfo.decimals : 6
      )
    })
  )

  return tokens
}

export const tickerToAddress = (ticker: string): string => {
  return addressTickerMap[ticker] || ticker
}

export const parsePathFeeToFeeString = (pathFee: string): string => {
  return (+pathFee.replace('_', '') * Math.pow(10, 8)).toString()
}

export const getTokenProgramId = async (
  connection: Connection,
  address: PublicKey
): Promise<PublicKey> => {
  return await getTokenProgramAddress(connection, address)
}
