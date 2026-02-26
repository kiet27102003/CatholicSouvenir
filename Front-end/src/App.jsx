import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ArtisanDashboard from './pages/artisan/ArtisanDashboard'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/artisan" element={<ArtisanDashboard />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
