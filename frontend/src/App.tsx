import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RedirectIfAuthed } from './components/RedirectIfAuthed/RedirectIfAuthed'
import { RequireAuth } from './components/RequireAuth/RequireAuth'
import { Layout } from './components/Layout/Layout'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { CartPage } from './pages/CartPage/CartPage'
import { CheckoutPage } from './pages/CheckoutPage/CheckoutPage'
import { LoginPage } from './pages/LoginPage/LoginPage'
import { OrderCompletePage } from './pages/OrderCompletePage/OrderCompletePage'
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

              <Route element={<RedirectIfAuthed />}>
                <Route path="register" element={<RegisterPage />} />
                <Route path="login" element={<LoginPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="checkout/payment" element={<PaymentPage />} />
                <Route path="orders/:id/complete" element={<OrderCompletePage />} />
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
