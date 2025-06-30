import React, { useState } from "react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = [
  {
    id: "daily",
    name: "Daily Pass",
    desc: "One night access",
    price: "$1.99",
    color: "pink",
  },
  {
    id: "monthly",
    name: "VIP Monthly",
    desc: "Unlimited access + perks",
    price: "$29.99",
    color: "purple",
  },
];

export default function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState("daily");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [username, setUsername] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayPalLoading, setShowPayPalLoading] = useState(false);

  if (!open) return null;

  // Format card number as 1234 5678 9012 3456
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.slice(0, 16);
    let formatted = "";
    for (let i = 0; i < value.length; i += 4) {
      if (i > 0) formatted += " ";
      formatted += value.substr(i, 4);
    }
    setCardNumber(formatted);
  };

  // Simulate PayPal payment
  const handlePayPalPayment = () => {
    setShowPayPalLoading(true);
    setIsProcessing(true);
    setTimeout(() => {
      setShowPayPalLoading(false);
      setIsProcessing(false);
      // Simulate redirect to PayPal
      window.open("https://www.sandbox.paypal.com/signin", "_blank");
      onOpenChange(false);
    }, 1800);
  };

  // Simulate Credit Card payment
  const handleCreditCardPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert("Payment processed!");
      onOpenChange(false);
    }, 1500);
  };

  const payAmount = selectedPlan === "daily" ? "$1.99" : "$29.99";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#181c2b] rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col md:flex-row overflow-hidden border border-[#23263a] relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          ×
        </button>

        {/* Left */}
        <div className="flex-1 p-8 bg-[#181c2b]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Join the VIP Experience
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Enter your details and choose your access level
            </p>
          </div>

          {/* Username */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="w-full h-12 px-4 rounded-lg bg-[#23263a] border border-[#35395a] text-white placeholder-gray-500 focus:border-pink-400 outline-none transition"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          {/* Plan Selection */}
          <div>
            <label className="block text-white font-medium mb-2">Choose Your Access</label>
            <div className="space-y-4">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${
                      selectedPlan === plan.id
                        ? plan.color === "pink"
                          ? "border-pink-400 bg-pink-400/10"
                          : "border-purple-400 bg-purple-400/10"
                        : "border-[#35395a] hover:border-pink-400"
                    }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="flex items-center">
                    <span
                      className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        selectedPlan === plan.id
                          ? plan.color === "pink"
                            ? "border-pink-400"
                            : "border-purple-400"
                          : "border-gray-500"
                      }`}
                    >
                      {selectedPlan === plan.id && (
                        <span
                          className={`w-3 h-3 rounded-full ${
                            plan.color === "pink" ? "bg-pink-400" : "bg-purple-400"
                          }`}
                        />
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-white">{plan.name}</div>
                      <div className="text-sm text-gray-400">{plan.desc}</div>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-xl ${
                      plan.color === "pink" ? "text-pink-400" : "text-purple-400"
                    }`}
                  >
                    {plan.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex-1 p-8 bg-[#23263a] border-l border-[#23263a] min-w-[340px] flex flex-col">
          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">Payment Method</label>
            <div className="space-y-3">
              <div
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === "card"
                    ? "border-blue-400 bg-blue-400/10"
                    : "border-[#35395a] hover:border-blue-400"
                }`}
                onClick={() => setPaymentMethod("card")}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    paymentMethod === "card" ? "border-blue-400" : "border-gray-500"
                  }`}
                >
                  {paymentMethod === "card" && (
                    <span className="w-3 h-3 rounded-full bg-blue-400" />
                  )}
                </span>
                <span className="text-white font-medium">Credit Card</span>
              </div>
              <div
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  paymentMethod === "paypal"
                    ? "border-yellow-400 bg-yellow-400/10"
                    : "border-[#35395a] hover:border-yellow-400"
                }`}
                onClick={() => setPaymentMethod("paypal")}
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    paymentMethod === "paypal" ? "border-yellow-400" : "border-gray-500"
                  }`}
                >
                  {paymentMethod === "paypal" && (
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  )}
                </span>
                <span className="h-6 w-6 bg-yellow-400 rounded flex items-center justify-center mr-2">
                  <span className="text-sm font-bold text-black">P</span>
                </span>
                <span className="text-white font-medium">PayPal</span>
              </div>
            </div>
          </div>

          {/* Card Details */}
          {paymentMethod === "card" && (
            <div className="mb-6 bg-[#23263a] rounded-xl border border-[#35395a] p-6">
              <div className="font-medium text-white mb-4">Card Details</div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1" htmlFor="cardNumber">
                  Card Number
                </label>
                <input
                  id="cardNumber"
                  className="w-full h-12 px-4 rounded-lg bg-[#23263a] border border-[#35395a] text-white placeholder-gray-400 focus:border-blue-400 outline-none font-mono"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1" htmlFor="expiry">
                    Expiry Date
                  </label>
                  <input
                    id="expiry"
                    className="w-full h-12 px-4 rounded-lg bg-[#23263a] border border-[#35395a] text-white placeholder-gray-400 focus:border-blue-400 outline-none font-mono"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={e => setExpiry(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1" htmlFor="cvv">
                    CVV
                  </label>
                  <input
                    id="cvv"
                    className="w-full h-12 px-4 rounded-lg bg-[#23263a] border border-[#35395a] text-white placeholder-gray-400 focus:border-blue-400 outline-none font-mono"
                    placeholder="123"
                    value={cvv}
                    onChange={e => setCvv(e.target.value)}
                    maxLength={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* PayPal Details */}
          {paymentMethod === "paypal" && (
            <div className="mb-6 bg-[#23263a] rounded-xl border border-[#35395a] p-6 flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:shadow-2xl">
              <button
                className="flex flex-col items-center w-full focus:outline-none"
                onClick={handlePayPalPayment}
                disabled={isProcessing || showPayPalLoading}
                type="button"
              >
                <div className="h-16 w-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4 transition-transform duration-200 hover:scale-110 hover:shadow-lg">
                  <span className="text-2xl font-bold text-black">P</span>
                </div>
                <div className="text-white font-semibold text-lg mb-1">Pay with PayPal</div>
                <div className="text-gray-400 text-center text-sm">
                  You'll be redirected to PayPal to complete your payment
                </div>
                {showPayPalLoading && (
                  <div className="mt-4 flex items-center space-x-2">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></span>
                    <span className="text-yellow-400">Connecting...</span>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Pay Button */}
          <button
            className={`w-full rounded-lg py-4 mt-2 text-lg font-semibold shadow-lg transition-all duration-300
              ${
                !username || isProcessing
                  ? "bg-gradient-to-r from-pink-900 to-purple-900 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              }`}
            disabled={!username || isProcessing}
            onClick={() => {
              if (paymentMethod === "paypal") {
                handlePayPalPayment();
              } else {
                handleCreditCardPayment();
              }
            }}
          >
            {isProcessing || showPayPalLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                <span>Processing...</span>
              </span>
            ) : (
              `Pay ${payAmount}`
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Secure payment powered by Stripe. Your information is protected.
          </p>
        </div>
      </div>
    </div>
  );
}