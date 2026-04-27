import { useState } from 'react'
import './index.css'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'

export default function App() {
  const [page, setPage] = useState('landing')

  return page === 'landing'
    ? <Landing onLaunch={() => setPage('dashboard')} />
    : <Dashboard />
}
