import { BN } from '@project-serum/anchor'
import { PublicKey } from '@solana/web3.js'
import { FormatNumberThreshold, PrefixConfig } from './types'
import { FEE_TIERS } from '@invariant-labs/sdk-eclipse/lib/utils'
export interface FeeTier {
  fee: BN
  tickSpacing?: number
}
export const DECIMAL = 12
export const FEE_DECIMAL = 5
export const FEE_OFFSET = new BN(10).pow(new BN(DECIMAL - FEE_DECIMAL))
export const fromFee = (fee: BN): BN => {
  // e.g fee - BN(1) -> 0.001%
  return fee.mul(FEE_OFFSET)
}

//TODO replace mocked decimal
export const LPTokenDecimals = 6
export enum RPC {
  TEST = 'https://testnet.dev2.eclipsenetwork.xyz',
  DEV = 'https://staging-rpc.dev2.eclipsenetwork.xyz',
  DEV_EU = 'https://staging-rpc-eu.dev2.eclipsenetwork.xyz',
  LOCAL = 'http://127.0.0.1:8899'
}

export enum NetworkType {
  DEVNET = 'Devnet',
  TESTNET = 'Testnet',
  LOCALNET = 'Localnet',
  MAINNET = 'Mainnet'
}

export const WRAPPED_ETH_ADDRESS = 'So11111111111111111111111111111111111111112'

export const WETH_MIN_DEPOSIT_SWAP_FROM_AMOUNT = new BN(9200961)

export const WETH_POSITION_INIT_LAMPORTS = new BN(6164600)
export const WETH_POSITION_INIT_LAMPORTS_TEST = new BN(61646)

export const WETH_POOL_INIT_LAMPORTS = new BN(106000961)
export const WETH_POOL_INIT_LAMPORTS_TEST = new BN(1060009)
export const DEFAULT_PUBLICKEY = new PublicKey(0)

export const USDC_DEV: Token = {
  symbol: 'USDC',
  address: new PublicKey('GEds1ARB3oywy2sSdiNGDyxz9MhpfqPkFYYStdZmHaiN'),
  decimals: 9,
  name: 'USD Coin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  coingeckoId: 'usd-coin'
}
export const BTC_DEV: Token = {
  symbol: 'BTC',
  address: new PublicKey('CfwLhXJ2r2NmUE1f7oAeySY6eEZ7f5tC8v95nopUs5ez'),
  decimals: 9,
  name: 'Bitcoin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
  coingeckoId: 'bitcoin'
}
export const WETH_DEV: Token = {
  symbol: 'ETH',
  address: new PublicKey('So11111111111111111111111111111111111111112'),
  decimals: 9,
  name: 'Ethereum',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png',
  coingeckoId: 'ethereum'
}

export const USDC_TEST: Token = {
  symbol: 'USDC',
  address: new PublicKey('5gFSyxjNsuQsZKn9g5L9Ky3cSUvJ6YXqWVuPzmSi8Trx'),
  decimals: 9,
  name: 'USD Coin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  coingeckoId: 'usd-coin'
}

export const BTC_TEST: Token = {
  symbol: 'BTC',
  address: new PublicKey('2F5TprcNBqj2hXVr9oTssabKdf8Zbsf9xStqWjPm8yLo'),
  decimals: 9,
  name: 'Bitcoin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
  coingeckoId: 'bitcoin'
}

export const WETH_TEST: Token = {
  symbol: 'ETH',
  address: new PublicKey('So11111111111111111111111111111111111111112'),
  decimals: 9,
  name: 'Ether',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png',
  coingeckoId: 'ethereum'
}

export enum Network {
  LOCAL = 0,
  DEV = 1,
  TEST = 2,
  MAIN = 3
}

export interface Token {
  symbol: string
  address: PublicKey
  decimals: number
  name: string
  logoURI: string
  coingeckoId?: string
  isUnknown?: boolean
}

export interface BestTier {
  tokenX: PublicKey
  tokenY: PublicKey
  bestTierIndex: number
}

const mainnetBestTiersCreator = () => {
  // const stableTokens: Record<string, PublicKey> = {
  // }

  // const unstableTokens: Record<string, PublicKey> = {
  // }

  const bestTiers: BestTier[] = []

  // for (let i = 0; i < 4; i++) {
  //   const tokenX = Object.values(stableTokens)[i]
  //   for (let j = i + 1; j < 4; j++) {
  //     const tokenY = Object.values(stableTokens)[j]

  //     bestTiers.push({
  //       tokenX,
  //       tokenY,
  //       bestTierIndex: 0
  //     })
  //   }
  // }

  // for (let i = 0; i < 5; i++) {
  //   const [symbolX, tokenX] = Object.entries(unstableTokens)[i]
  //   for (let j = i + 1; j < 5; j++) {
  //     const [symbolY, tokenY] = Object.entries(unstableTokens)[j]

  //     if (symbolX.slice(-3) === 'ETH' && symbolY.slice(-3) === 'ETH') {
  //       bestTiers.push({
  //         tokenX,
  //         tokenY,
  //         bestTierIndex: 0
  //       })
  //     } else {
  //       bestTiers.push({
  //         tokenX,
  //         tokenY,
  //         bestTierIndex: 2
  //       })
  //     }
  //   }
  // }

  // for (let i = 0; i < 4; i++) {
  //   const tokenX = Object.values(stableTokens)[i]
  //   for (let j = 0; j < 5; j++) {
  //     const tokenY = Object.values(unstableTokens)[j]

  //     bestTiers.push({
  //       tokenX,
  //       tokenY,
  //       bestTierIndex: 2
  //     })
  //   }
  // }

  return bestTiers
}
export const bestTiers: Record<NetworkType, BestTier[]> = {
  Devnet: [
    {
      tokenX: USDC_DEV.address,
      tokenY: WETH_DEV.address,
      bestTierIndex: 2
    },
    {
      tokenX: USDC_DEV.address,
      tokenY: BTC_DEV.address,
      bestTierIndex: 2
    }
  ],
  Testnet: [
    {
      tokenX: USDC_TEST.address,
      tokenY: WETH_TEST.address,
      bestTierIndex: 2
    },
    {
      tokenX: USDC_TEST.address,
      tokenY: BTC_TEST.address,
      bestTierIndex: 2
    }
  ],
  Mainnet: mainnetBestTiersCreator(),
  Localnet: []
}

export const commonTokensForNetworks: Record<NetworkType, PublicKey[]> = {
  Devnet: [USDC_DEV.address, BTC_DEV.address, WETH_DEV.address],
  Mainnet: [],
  Testnet: [USDC_TEST.address, BTC_TEST.address, WETH_TEST.address],
  Localnet: []
}
export const airdropTokens: Record<NetworkType, PublicKey[]> = {
  Devnet: [USDC_DEV.address, BTC_DEV.address],
  Mainnet: [],
  Testnet: [USDC_TEST.address, BTC_TEST.address],
  Localnet: []
}

export const airdropQuantities: Record<NetworkType, number[]> = {
  Devnet: [100 * 10 ** USDC_DEV.decimals, 0.0025 * 10 ** BTC_DEV.decimals],
  Mainnet: [],
  Testnet: [10 * 10 ** USDC_TEST.decimals, 0.00025 * 10 ** BTC_TEST.decimals],
  Localnet: []
}

export const defaultThresholds: FormatNumberThreshold[] = [
  {
    value: 10,
    decimals: 4
  },
  {
    value: 1000,
    decimals: 2
  },
  {
    value: 10000,
    decimals: 1
  },
  {
    value: 1000000,
    decimals: 2,
    divider: 1000
  },
  {
    value: 1000000000,
    decimals: 2,
    divider: 1000000
  },
  {
    value: Infinity,
    decimals: 2,
    divider: 1000000000
  }
]

export const defaultPrefixConfig: PrefixConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000
}

export const ALL_FEE_TIERS_DATA = FEE_TIERS.map((tier, index) => ({
  tier,
  primaryIndex: index
}))

export const addressTickerMap: { [key: string]: string } = {
  WETH: 'So11111111111111111111111111111111111111112',
  BTC: '3JXmQAzBPU66dkVQufSE1ChBMRAdCHp6T7ZMBKAwhmWw',
  USDC: '5W3bmyYDww6p5XRZnCR6m2c75st6XyCxW1TgGS3wTq7S',
  ETH: 'So11111111111111111111111111111111111111112'
}
