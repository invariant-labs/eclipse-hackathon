import { all, spawn } from '@redux-saga/core/effects'
import { connectionSaga } from './connection'
import { walletSaga } from './wallet'
import { poolsSaga } from './pools'

function* rootSaga(): Generator {
  yield all([connectionSaga, walletSaga, poolsSaga].map(spawn))
}
export default rootSaga
