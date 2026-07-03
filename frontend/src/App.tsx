import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthed } from './components/RedirectIfAuthed/RedirectIfAuthed'
import { RequireAdmin } from './components/RequireAdmin/RequireAdmin'
import { RequireAuth } from './components/RequireAuth/RequireAuth'
import { Layout } from './components/Layout/Layout'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { AdminOrderDetailPage } from './pages/AdminOrderDetailPage/AdminOrderDetailPage'
import { AdminOrderListPage } from './pages/AdminOrderListPage/AdminOrderListPage'
import { AdminProductFormPage } from './pages/AdminProductFormPage/AdminProductFormPage'
import { AdminProductListPage } from './pages/AdminProductListPage/AdminProductListPage'
import { CartPage } from './pages/CartPage/CartPage'
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage'
import { ContactPage } from './pages/ContactPage/ContactPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { MyPage } from './pages/MyPage/MyPage'
import { OrderCompletePage } from './pages/OrderCompletePage/OrderCompletePage'
import { OrderHistoryDetailPage } from './pages/OrderHistoryDetailPage/OrderHistoryDetailPage'
import { OrderHistoryPage } from './pages/OrderHistoryPage/OrderHistoryPage'
import { PaymentPage } from './pages/PaymentPage/PaymentPage'
import { ProductDetailPage } from './pages/ProductDetailPage/ProductDetailPage'
import { ProductListPage } from './pages/ProductListPage/ProductListPage'
import { RegisterPage } from './pages/RegisterPage/RegisterPage'
import { TopPage } from './pages/TopPage/TopPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<TopPage />} />
              <Route path="products" element={<ProductListPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="contact" element={<ContactPage />} />

              <Route element={<RedirectIfAuthed />}>
                <Route path="register" element={<RegisterPage />} />
                <Route path="login" element={<LoginPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="checkout/payment" element={<PaymentPage />} />
                <Route path="orders/:id/complete" element={<OrderCompletePage />} />

                <Route path="mypage" element={<MyPage />} />
                <Route path="orders" element={<OrderHistoryPage />} />
                <Route path="orders/:id" element={<OrderHistoryDetailPage />} />

                <Route element={<RequireAdmin />}>
                  <Route path="admin/products" element={<AdminProductListPage />} />
                  <Route path="admin/products/new" element={<AdminProductFormPage />} />
                  <Route path="admin/products/:id/edit" element={<AdminProductFormPage />} />
                  <Route path="admin/orders" element={<AdminOrderListPage />} />
                  <Route path="admin/orders/:id" element={<AdminOrderDetailPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
