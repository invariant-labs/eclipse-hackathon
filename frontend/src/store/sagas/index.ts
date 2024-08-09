import { all, spawn } from '@redux-saga/core/effects'
import { connectionSaga } from './connection'
import { walletSaga } from './wallet'

function* rootSaga(): Generator {
  yield all([connectionSaga, walletSaga].map(spawn))
}
export default rootSaga
