import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WhatsAppButton from "./components/WhatsAppButton";
import ExitIntentPopup from "./components/ExitIntentPopup";
import RecentPurchaseToast from "./components/RecentPurchaseToast";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const ScrollTop = () => {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const StorefrontLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
    <CartDrawer />
    <WhatsAppButton />
    <ExitIntentPopup />
    <RecentPurchaseToast />
  </>
);

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ScrollTop />
            <Routes>
              {/* Admin routes — no storefront chrome */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Storefront */}
              <Route path="/*" element={
                <StorefrontLayout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order/:id" element={<OrderSuccess />} />
                    <Route path="*" element={<Home />} />
                  </Routes>
                </StorefrontLayout>
              } />
            </Routes>
            <Toaster position="top-center" theme="dark" />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
