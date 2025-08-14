import { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiFetch } from "../utils/apiFetch";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: {
    start_date?: string;
    end_date?: string;
    plan?: string;
    status?: string;
  } | null;
}

const plans = [
  {
    id: "onehour",
    amount: 199, // cents
    name: "1-Hour Pass",
    desc: "Timed entry (shows countdown)",
    price: "$1.99",
    color: "pink",
  },
  {
    id: "oneday",
    amount: 2999, // cents
    name: "Daily Pass",
    desc: "24 hours access",
    price: "$29.99",
    color: "purple",
  },
] as const;

// notifications removed

export default function PaymentModal({
  open,
  onOpenChange,
  subscription,
}: PaymentModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[number]["id"]>("onehour");
  // const [paymentMethod, setPaymentMethod] = useState<"card">("card");
  const [isProcessing, setIsProcessing] = useState(false);
  // const [showPayPalLoading, setShowPayPalLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  // Removed notification state

  const stripe = useStripe();
  const elements = useElements();

  // Create PaymentIntent and confirm
  const handleCreditCardPayment = async () => {
    setIsProcessing(true);
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    const selected = plans.find(p => p.id === selectedPlan)!;

    // 1) Create payment intent
    const intentRes = await apiFetch(`/payment/intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: selected.id,
        method: "card",
        amount: selected.amount,
        currency: "usd",
      }),
    });
    if (!intentRes.ok) {
      setIsProcessing(false);
      return;
    }
    const { clientSecret } = await intentRes.json();

    // 2) Confirm card payment on client
    const confirm = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement!,
        billing_details: { email: user?.email ?? undefined },
      },
    });

    if (confirm.error || confirm.paymentIntent?.status !== "succeeded") {
      setIsProcessing(false);
      return;
    }

    // 3) Verify with backend to create subscription record
    const verifyRes = await apiFetch(`/payment/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId: confirm.paymentIntent!.id, plan: selected.id }),
    });
    if (verifyRes.ok) {
      onOpenChange(false);
    }
    setIsProcessing(false);
  };

  const payAmount = plans.find((p) => p.id === selectedPlan)?.price || "$0.00";
  useEffect(() => {
    if (open) {
      console.log(open);
      const user_email = localStorage.getItem("email");
      const user_id = localStorage.getItem("id");
      if (user_id && user_email) {
        try {
          setUser({ id: user_id, email: user_email });
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      {/* Notification Bar removed */}
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
          </div>

          {/* User & Subscription Info */}
          {(user || subscription) && (
            <div className="mb-6 p-4 rounded-lg bg-[#23263a] border border-[#35395a] text-white">
              {user && (
                <div className="mb-1">
                  <span className="font-semibold">Email:</span> {user.email}
                </div>
              )}
            </div>
          )}

          {/* Plan Selection */}
          <div>
            <label className="block text-white font-medium mb-2">
              Choose Your Access
            </label>
            <div className="space-y-4">
              {plans.map((plan) => (
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
                            plan.color === "pink"
                              ? "bg-pink-400"
                              : "bg-purple-400"
                          }`}
                        />
                      )}
                    </span>
                    <div>
                      <div className="font-semibold text-white">
                        {plan.name}
                      </div>
                      <div className="text-sm text-gray-400">{plan.desc}</div>
                    </div>
                  </div>
                  <div
                    className={`font-bold text-xl ${
                      plan.color === "pink"
                        ? "text-pink-400"
                        : "text-purple-400"
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
          {/* Credit Card Styled Input */}
          <div className="mb-6 flex flex-col items-center">
            <label className="block text-white font-medium mb-4 text-lg tracking-wide">
              Card Information
            </label>
            <div
              className="relative w-full max-w-xs bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 rounded-2xl shadow-2xl p-6 border-4 border-blue-400 flex flex-col items-start"
              style={{ minHeight: '180px', minWidth: '320px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
            >
              <div className="absolute top-4 right-6 text-white/60 text-xs font-mono tracking-widest select-none">
                VISA / MC / AMEX
              </div>
              <div className="mb-4 mt-2 text-white text-base font-semibold tracking-wider select-none">
                GROOVE CLUB
              </div>
              <div className="w-full">
                <CardElement
                  options={{
                    hidePostalCode: true,
                    style: {
                      base: {
                        color: '#fff',
                        fontSize: '18px',
                        letterSpacing: '2px',
                        '::placeholder': { color: '#a0aec0' },
                        backgroundColor: 'transparent',
                        fontFamily: 'monospace',
                        padding: '12px 0',
                      },
                      invalid: { color: '#fa755a' },
                    },
                  }}
                  onChange={(e: any) => {
                    setCardComplete(e.complete);
                  }}
                />
              </div>
              <div className="absolute bottom-4 left-6 text-xs text-white/60 font-mono select-none">
                Secure • Stripe
              </div>
              <div className="absolute bottom-4 right-6 w-10 h-6 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-sm shadow-inner flex items-center justify-center">
                <span className="text-xs font-bold text-gray-900">💳</span>
              </div>
            </div>
          </div>

          {/* Pay Button */}
          <button
            className={`w-full rounded-lg py-4 mt-2 text-lg font-semibold shadow-lg transition-all duration-300
              ${
                !user?.email || isProcessing || !cardComplete
                  ? "bg-gradient-to-r from-pink-900 to-purple-900 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              }`}
            disabled={isProcessing || !cardComplete}
            onClick={handleCreditCardPayment}
          >
            {!user?.email || isProcessing ? (
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
