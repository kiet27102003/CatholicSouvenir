import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppToastContainer } from './lib/appToast'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ArtisanDashboard from './pages/artisan/ArtisanDashboard'

import ForgotPasswordPage from './pages/ForgotPasswordPage'
import CustomerLayout from './pages/customer/CustomerLayout'
import ProfilePage from './pages/customer/ProfilePage'
import OrderHistoryPage from './pages/customer/OrderHistoryPage'
import RegisterForm from './components/RegisterForm/RegisterForm'
import ProductDetailsPage from './pages/ProductDetailsPage'
import ArtisanDirectoryPage from './pages/ArtisanDirectoryPage'
import ArtisanProfilePage from './pages/ArtisanProfilePage'
import ArtisanCentrePage from './pages/ArtisanCentrePage'
import ShopPage from './pages/ShopPage'
import CustomRequestPage from './pages/customer/CustomRequestPage'
import MyCustomRequestsPage from './pages/customer/MyCustomRequestsPage'
import MessageCenterPage from './pages/customer/MessageCenterPage'

import CheckoutPage from './pages/CheckoutPage'
import CartPage from './pages/CartPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFailedPage from './pages/PaymentFailedPage'
import OrderTrackingPage from './pages/customer/OrderTrackingPage'
import WalletPage from './pages/customer/WalletPage'
import CartDrawer from './components/CartDrawer/CartDrawer'

import AdminLayout from './pages/admin/AdminLayout'
import AdminWallets from './pages/admin/AdminWallets'
import AdminDashboard from './pages/admin/AdminDashboard'
import SystemConfig from './pages/admin/SystemConfig'
import UserManager from './pages/admin/UserManager'
import CustomerManager from './pages/admin/CustomerManager'
import CustomerDetailPage from './pages/admin/CustomerDetailPage'
import ArtisanManager from './pages/admin/ArtisanManager'
import ProductManager from './pages/admin/ProductManager'
import CategoryManager from './pages/admin/CategoryManager'
import ArtisanApplications from './pages/admin/ArtisanApplications'
import AdminComingSoon from './pages/admin/AdminComingSoon'

function App() {
  return (
    <AuthProvider>
      <AppToastContainer />
      <CartDrawer />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/products" element={<ShopPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/artisans" element={<ArtisanDirectoryPage />} />
        <Route path="/artisans/:id" element={<ArtisanProfilePage />} />
        <Route path="/artisan-centre" element={<ArtisanCentrePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/failed" element={<PaymentFailedPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/artisan" element={<ArtisanDashboard />} />
        <Route path="/artisan/templates" element={<ArtisanDashboard />} />

        {/* Admin Routes with Layout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="settings" element={<SystemConfig />} />
          <Route path="users" element={<UserManager />} />
          <Route path="customers" element={<CustomerManager />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="artisans" element={<ArtisanManager />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="orders" element={<AdminComingSoon title="Đơn hàng" />} />
          <Route path="payments" element={<AdminComingSoon title="Thanh toán" />} />
          <Route path="wallets" element={<AdminWallets />} />
          <Route path="categories" element={<CategoryManager />} />
          <Route path="artisan-applications" element={<ArtisanApplications />} />
        </Route>

        {/* Customer Routes inside Layout */}
        <Route element={<CustomerLayout />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
          <Route path="/orders/:orderId/tracking" element={<OrderTrackingPage />} />
          <Route path="/custom-requests" element={<CustomRequestPage />} />
          <Route path="/my-custom-requests" element={<MyCustomRequestsPage />} />
          <Route path="/messages" element={<MessageCenterPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App

