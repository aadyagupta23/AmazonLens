import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Homepage from "./pages/Homepage.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import SmartSearchPage from "./pages/SmartSearchPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import SustainabilityPage from "./pages/SustainabilityPage.jsx";
import StubPage from "./pages/StubPage.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-[#EAEDED]">
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/s" element={<SearchResults />} />
        <Route path="/dp/:productId" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/smart-search" element={<SmartSearchPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/sustainability" element={<SustainabilityPage />} />
        <Route path="/prime" element={<StubPage />} />
        <Route path="/help" element={<StubPage />} />
        <Route path="/sell" element={<StubPage />} />
        <Route path="/gift-cards" element={<StubPage />} />
        <Route path="/registry" element={<StubPage />} />
        <Route path="/amazon-pay" element={<StubPage />} />
        <Route path="/minitv" element={<StubPage />} />
        <Route path="/history" element={<StubPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
