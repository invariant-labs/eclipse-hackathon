import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import LiquidityPage from './LiquidityPage'
import RootPage from './RootPage'
import StatsPage from './StatsPage'
import SwapPage from './SwapPage'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<RootPage />}>
      <Route path='/exchange/:item1?/:item2?' element={<SwapPage />} />
      <Route path='/statistics' element={<StatsPage />} />
      <Route path='/liquidity/:tab?/:item1?/:item2?/:item3?' element={<LiquidityPage />} />
      <Route path='*' element={<Navigate to='/exchange' replace />} />
    </Route>
  )
)
