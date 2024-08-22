import { actions, MintData, PairTokens, PoolWithAddress } from '@store/reducers/pools'
import { network, rpcAddress } from '@store/selectors/connection'
import { all, call, put, select, spawn, takeLatest } from 'typed-redux-saga'
import { PayloadAction } from '@reduxjs/toolkit'
import { getMarketProgram } from '@web3/programs/amm'
import { getPools } from '@store/consts/utils'
import { Pair } from '@invariant-labs/sdk-eclipse'
import { FEE_TIERS, getMaxTick, getMinTick } from '@invariant-labs/sdk-eclipse/lib/utils'
import { getProtocolProgram } from '@web3/programs/protocol'
import { AnchorProvider, BN } from '@project-serum/anchor'
import { BlockheightBasedTransactionConfirmationStrategy, Transaction } from '@solana/web3.js'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { getConnection } from './connection'
import { getWallet } from './wallet'
import { createLoaderKey } from '@utils/utils'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { SIGNING_SNACKBAR_CONFIG } from '@store/consts/static'
import { closeSnackbar } from 'notistack'

export interface iTick {
  index: iTick[]
}

export function* fetchPoolData(action: PayloadAction<Pair>) {
  const networkType = yield* select(network)
  const rpc = yield* select(rpcAddress)
  const marketProgram = yield* call(getMarketProgram, networkType, rpc)
  try {
    const poolData = yield* call([marketProgram, marketProgram.getPool], action.payload)
    const address = yield* call(
      [action.payload, action.payload.getAddress],
      marketProgram.program.programId
    )

    yield* put(
      actions.addPools([
        {
          ...poolData,
          address
        }
      ])
    )
  } catch (error) {
    yield* put(actions.addPools([]))
  }
}

export function* fetchAllPoolsForPairData(action: PayloadAction<PairTokens>) {
  const networkType = yield* select(network)
  const rpc = yield* select(rpcAddress)
  const marketProgram = yield* call(getMarketProgram, networkType, rpc)
  const pairs = FEE_TIERS.map(fee => new Pair(action.payload.first, action.payload.second, fee))
  const pools: PoolWithAddress[] = yield call(getPools, pairs, marketProgram)

  yield* put(actions.addPools(pools))
}

export function* fetchLpPoolData(action: PayloadAction<Pair>) {
  const networkType = yield* select(network)
  const rpc = yield* select(rpcAddress)
  const protocolProgram = yield* call(getProtocolProgram, networkType, rpc)
  try {
    const poolData = yield* call([protocolProgram, protocolProgram.getLpPool], action.payload)
    const address = yield* call(
      [action.payload, action.payload.getAddress],
      protocolProgram.program.programId
    )

    yield* put(
      actions.addLpPools([
        {
          ...poolData,
          address
        }
      ])
    )
  } catch (error) {
    yield* put(actions.addLpPools([]))
  }
}

export function* handleMint(action: PayloadAction<MintData>) {
  const { pair, lpPoolExists } = action.payload

  const networkType = yield* select(network)
  const rpc = yield* select(rpcAddress)
  const wallet = yield* call(getWallet)
  const connection = yield* call(getConnection)

  const protocolProgram = yield* call(getProtocolProgram, networkType, rpc)
  const marketProgram = yield* call(getMarketProgram, networkType, rpc)

  const tx = new Transaction()

  if (lpPoolExists) {
    const initLpPoolIx = yield* call([protocolProgram, protocolProgram.initLpPoolIx], {
      pair
    })
    tx.add(initLpPoolIx)

    const lowerTickIndex = getMinTick(pair.feeTier.tickSpacing ?? 0)
    try {
      yield* call([marketProgram, marketProgram.getTick], pair, lowerTickIndex)
    } catch (e) {
      const createLowerTickIx = yield* call([marketProgram, marketProgram.createTickInstruction], {
        pair,
        index: getMinTick(pair.feeTier.tickSpacing ?? 0)
      })
      tx.add(createLowerTickIx)
    }

    const upperTickIndex = getMaxTick(pair.feeTier.tickSpacing ?? 0)
    try {
      yield* call([marketProgram, marketProgram.getTick], pair, upperTickIndex)
    } catch (e) {
      const createLowerTickIx = yield* call([marketProgram, marketProgram.createTickInstruction], {
        pair,
        index: getMinTick(pair.feeTier.tickSpacing ?? 0)
      })
      tx.add(createLowerTickIx)
    }
  }

  const { address: stateAddress } = yield* call([marketProgram, marketProgram.getStateAddress])
  const { positionListAddress } = yield* call(
    [marketProgram, marketProgram.getPositionListAddress],
    protocolProgram.programAuthority
  )
  const { positionAddress } = yield* call(
    [marketProgram, marketProgram.getPositionAddress],
    protocolProgram.programAuthority,
    0
  )
  const { positionAddress: lastPositionAddress } = yield* call(
    [marketProgram, marketProgram.getPositionAddress],
    protocolProgram.programAuthority,
    0
  )
  const { tickAddress: lowerTickAddress } = yield* call(
    [marketProgram, marketProgram.getTickAddress],
    pair,
    getMinTick(pair.feeTier.tickSpacing ?? 0)
  )
  const { tickAddress: upperTickAddress } = yield* call(
    [marketProgram, marketProgram.getTickAddress],
    pair,
    getMaxTick(pair.feeTier.tickSpacing ?? 0)
  )
  const pool = yield* call([marketProgram, marketProgram.getPool], pair)
  const accountXAddress = yield* call(getAssociatedTokenAddress, pool.tokenX, wallet.publicKey)
  const accountYAddress = yield* call(getAssociatedTokenAddress, pool.tokenY, wallet.publicKey)
  const { programAuthority } = yield* call([marketProgram, marketProgram.getProgramAuthority])

  const mintIx = yield* call([protocolProgram, protocolProgram.mintLpTokenIx], {
    pair,
    index: 0,
    liquidityDelta: new BN(10000),
    invProgram: marketProgram.program.programId,
    invState: stateAddress,
    position: positionAddress,
    lastPosition: lastPositionAddress,
    positionList: positionListAddress,
    lowerTick: lowerTickAddress,
    upperTick: upperTickAddress,
    tickmap: pool.tickmap,
    accountX: accountXAddress,
    accountY: accountYAddress,
    invReserveX: pool.tokenXReserve,
    invReserveY: pool.tokenYReserve,
    invProgramAuthority: programAuthority
  })
  tx.add(mintIx)

  const blockhash = yield* call([connection, connection.getLatestBlockhash])
  tx.recentBlockhash = blockhash.blockhash
  tx.feePayer = wallet.publicKey
  const signedTx = yield* call([wallet, wallet.signTransaction], tx)
  const signature = yield* call(
    [connection, connection.sendRawTransaction],
    signedTx.serialize(),
    AnchorProvider.defaultOptions()
  )

  const confirmStrategy: BlockheightBasedTransactionConfirmationStrategy = {
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
    signature
  }
  yield* call([connection, connection.confirmTransaction], confirmStrategy)
}

export function* handleBurn(action: PayloadAction<Pair>) {
  const loaderHandleBurn = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Removing liquidity...',
        variant: 'pending',
        persist: true,
        key: loaderHandleBurn
      })
    )

    const pair = action.payload

    const networkType = yield* select(network)
    const rpc = yield* select(rpcAddress)
    const wallet = yield* call(getWallet)
    const connection = yield* call(getConnection)

    const protocolProgram = yield* call(getProtocolProgram, networkType, rpc)
    const marketProgram = yield* call(getMarketProgram, networkType, rpc)

    const tx = new Transaction()

    const { address: stateAddress } = yield* call([marketProgram, marketProgram.getStateAddress])
    const { positionListAddress } = yield* call(
      [marketProgram, marketProgram.getPositionListAddress],
      protocolProgram.programAuthority
    )
    const { positionAddress } = yield* call(
      [marketProgram, marketProgram.getPositionAddress],
      protocolProgram.programAuthority,
      0
    )
    const { positionAddress: lastPositionAddress } = yield* call(
      [marketProgram, marketProgram.getPositionAddress],
      protocolProgram.programAuthority,
      0
    )
    const { tickAddress: lowerTickAddress } = yield* call(
      [marketProgram, marketProgram.getTickAddress],
      pair,
      getMinTick(pair.feeTier.tickSpacing ?? 0)
    )
    const { tickAddress: upperTickAddress } = yield* call(
      [marketProgram, marketProgram.getTickAddress],
      pair,
      getMaxTick(pair.feeTier.tickSpacing ?? 0)
    )
    const pool = yield* call([marketProgram, marketProgram.getPool], pair)
    const accountXAddress = yield* call(getAssociatedTokenAddress, pool.tokenX, wallet.publicKey)
    const accountYAddress = yield* call(getAssociatedTokenAddress, pool.tokenY, wallet.publicKey)
    const { programAuthority } = yield* call([marketProgram, marketProgram.getProgramAuthority])

    const burnIx = yield* call([protocolProgram, protocolProgram.burnLpTokenIx], {
      pair,
      index: 0,
      liquidityDelta: new BN(10000),
      invProgram: marketProgram.program.programId,
      invState: stateAddress,
      position: positionAddress,
      lastPosition: lastPositionAddress,
      positionList: positionListAddress,
      lowerTick: lowerTickAddress,
      upperTick: upperTickAddress,
      tickmap: pool.tickmap,
      accountX: accountXAddress,
      accountY: accountYAddress,
      invReserveX: pool.tokenXReserve,
      invReserveY: pool.tokenYReserve,
      invProgramAuthority: programAuthority
    })
    tx.add(burnIx)

    const blockhash = yield* call([connection, connection.getLatestBlockhash])
    tx.recentBlockhash = blockhash.blockhash
    tx.feePayer = wallet.publicKey

    yield put(snackbarsActions.add({ ...SIGNING_SNACKBAR_CONFIG, key: loaderSigningTx }))

    const signedTx = yield* call([wallet, wallet.signTransaction], tx)

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const signature = yield* call(
      [connection, connection.sendRawTransaction],
      signedTx.serialize(),
      AnchorProvider.defaultOptions()
    )

    const confirmStrategy: BlockheightBasedTransactionConfirmationStrategy = {
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
      signature
    }
    yield* call([connection, connection.confirmTransaction], confirmStrategy)

    closeSnackbar(loaderHandleBurn)
    yield put(snackbarsActions.remove(loaderHandleBurn))
  } catch (error) {
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderHandleBurn)
    yield put(snackbarsActions.remove(loaderHandleBurn))

    console.error('Error burning LP tokens:', error)
  }
}

export function* getPoolDataHandler(): Generator {
  yield* takeLatest(actions.getPoolData, fetchPoolData)
}

export function* getAllPoolsForPairDataHandler(): Generator {
  yield* takeLatest(actions.getAllPoolsForPairData, fetchAllPoolsForPairData)
}

export function* getLpPoolDataHandler(): Generator {
  yield* takeLatest(actions.getLpPoolData, fetchLpPoolData)
}

export function* mintHandler(): Generator {
  yield* takeLatest(actions.mint, handleMint)
}

export function* burnHandler(): Generator {
  yield* takeLatest(actions.burn, handleBurn)
}

export function* poolsSaga(): Generator {
  yield all(
    [
      getPoolDataHandler,
      getAllPoolsForPairDataHandler,
      getLpPoolDataHandler,
      mintHandler,
      burnHandler
    ].map(spawn)
  )
}
