import { BN } from "@project-serum/anchor"
import { PublicKey } from "@solana/web3.js"

export enum RPC {
    TEST = 'https://testnet.dev2.eclipsenetwork.xyz', 
    MAIN = 'https://staging-rpc-eu.dev2.eclipsenetwork.xyz',
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