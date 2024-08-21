import { Market, Pair } from '@invariant-labs/sdk-eclipse'
import { PoolStructure } from '@invariant-labs/sdk-eclipse/lib/market'
import { PublicKey } from '@solana/web3.js'
import { PoolWithAddress } from '@store/reducers/pools'

export const getPools = async (
  pairs: Pair[],
  marketProgram: Market
): Promise<PoolWithAddress[]> => {
  const addresses: PublicKey[] = await Promise.all(
    pairs.map(async pair => await pair.getAddress(marketProgram.program.programId))
  )

  return await getPoolsFromAdresses(addresses, marketProgram)
}

export const getPoolsFromAdresses = async (
  addresses: PublicKey[],
  marketProgram: Market
): Promise<PoolWithAddress[]> => {
  const pools = (await marketProgram.program.account.pool.fetchMultiple(
    addresses
  )) as Array<PoolStructure | null>

  return pools
    .map((pool, index) =>
      pool !== null
        ? {
            ...pool,
            address: addresses[index]
          }
        : null
    )
    .filter(pool => pool !== null) as PoolWithAddress[]
}
