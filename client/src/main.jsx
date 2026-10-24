import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import { AuthProvider } from "./auth.jsx";
import "./styles.css";

const googleId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const app = (
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  googleId ? <GoogleOAuthProvider clientId={googleId}>{app}</GoogleOAuthProvider> : app
);
