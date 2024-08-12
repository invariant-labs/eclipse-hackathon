import { ISwapStore, swapSliceName } from '../reducers/swap'
import { AnyProps, keySelectors } from './helpers'

const store = (s: AnyProps) => s[swapSliceName] as ISwapStore

export const { swap, simulateResult } = keySelectors(store, ['swap', 'simulateResult'])

export const swapSelectors = { swap, simulateResult }

export default swapSelectors
