import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ArtisanDashboard from './pages/artisan/ArtisanDashboard'

import ForgotPasswordPage from './pages/ForgotPasswordPage'
import RegisterPage from './pages/RegisterPage'
import CustomerLayout from './pages/customer/CustomerLayout'
import ProfilePage from './pages/customer/ProfilePage'
import OrderHistoryPage from './pages/customer/OrderHistoryPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import ArtisanDirectoryPage from './pages/ArtisanDirectoryPage'
import ArtisanProfilePage from './pages/ArtisanProfilePage'
import CustomRequestPage from './pages/customer/CustomRequestPage'
import MessageCenterPage from './pages/customer/MessageCenterPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderTrackingPage from './pages/customer/OrderTrackingPage'
import CartDrawer from './components/CartDrawer/CartDrawer'

import AdminLayout from './pages/admin/AdminLayout'
import SystemConfig from './pages/admin/SystemConfig'
import UserManager from './pages/admin/UserManager'

function App() {
  return (
    <AuthProvider>
      <CartDrawer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/artisans" element={<ArtisanDirectoryPage />} />
        <Route path="/artisans/:id" element={<ArtisanProfilePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/artisan" element={<ArtisanDashboard />} />

        {/* Admin Routes with Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/settings" replace />} />
          <Route path="settings" element={<SystemConfig />} />
          <Route path="users" element={<UserManager />} />
          <Route path="security" element={<div className="p-8">Security Logs coming soon...</div>} />
          <Route path="api-keys" element={<div className="p-8">API Keys coming soon...</div>} />
        </Route>

        {/* Customer Routes inside Layout */}
        <Route element={<CustomerLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id/tracking" element={<OrderTrackingPage />} />
          <Route path="/custom-requests" element={<CustomRequestPage />} />
          <Route path="/messages" element={<MessageCenterPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

