import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CartProvider } from "./contexts/CartContext.jsx";
import { OrdersProvider } from "./contexts/OrdersContext.jsx";
import { WishlistProvider } from "./contexts/WishlistContext.jsx";
import { SustainabilityProvider } from "./contexts/SustainabilityContext.jsx";
import { CoPlannerProvider } from "./contexts/CoPlannerContext.jsx";
import { HistoryProvider } from "./contexts/HistoryContext.jsx";
import { ReviewsProvider } from "./contexts/ReviewsContext.jsx";
import CoPlannerPicker from "./components/CoPlannerPicker.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <OrdersProvider>
          <WishlistProvider>
            <SustainabilityProvider>
              <CoPlannerProvider>
                <HistoryProvider>
                  <ReviewsProvider>
                    <App />
                    <CoPlannerPicker />
                  </ReviewsProvider>
                </HistoryProvider>
              </CoPlannerProvider>
            </SustainabilityProvider>
          </WishlistProvider>
        </OrdersProvider>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);
