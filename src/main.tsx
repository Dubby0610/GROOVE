import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import App from "./App.tsx";
import "./index.css";

const stripePromise = loadStripe(
  "pk_test_51RgYMrLJMvQ3XoVWf5AuqIJgkaGN6RDGtsfqLMEc4VxRqtzj12EIxAjbkkWIuBaos4KyzVGQO81Jf0PBjQwIDZfH00s8wL5eum"
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  </StrictMode>
);
