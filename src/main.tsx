import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import App from "./App.tsx";
import "./index.css";

const stripePromise = loadStripe(
  "pk_test_51RgYN6Q9yu5psNP69R1oXojRV7fw6Z5ESUAWc4YcGD3aN0pm9faTiEvmkeKH5gvmjl9au6AvpbsK9rhR1Fh0cUam00wuCC1qZg"
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  </StrictMode>
);
