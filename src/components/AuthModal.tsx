import { useState } from "react";
import { apiFetch } from "../utils/apiFetch";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess: (
    user: any,
    tokens: { accessToken: string; refreshToken: string }
  ) => void;
  themeColor?: string;
}

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onOpenChange,
  onAuthSuccess,
  themeColor = "#06f6f6",
}) => {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateEmail(email)) {
      setError("Invalid email");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (tab === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const endpoint = tab === "signin" ? "/auth/login" : "/auth/signup";
      const body =
        tab === "signin"
          ? { email, password }
          : { email, password, confirmPassword };
      const res = await apiFetch(`${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
            (data.errors && data.errors[0]?.msg) ||
            "Authentication failed"
        );
      } else {
        // Store tokens
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        onAuthSuccess(data.user, {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        onOpenChange(false);
      }
    } catch (err) {
      console.log(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm p-8 rounded-2xl shadow-2xl border-2 animate-[wander_8s_ease-in-out_infinite]"
        style={{
          background: `linear-gradient(135deg, ${themeColor}33 0%, #18181b 100%)`, // 33 = 20% opacity
          borderColor: themeColor,
          boxShadow: `0 0 48px 8px ${themeColor}, 0 0 16px 2px ${themeColor}`,
        }}
      >
        <div className="flex mb-6">
          <button
            className={`flex-1 py-2 font-bold rounded-l-xl transition-all duration-200 ${
              tab === "signin" ? "" : "bg-opacity-20"
            }`}
            style={
              tab === "signin"
                ? {
                    background: themeColor,
                    color: "#18181b",
                    boxShadow: `0 0 12px 2px ${themeColor}`,
                  }
                : { background: `${themeColor}22`, color: themeColor }
            }
            onClick={() => setTab("signin")}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 font-bold rounded-r-xl transition-all duration-200 ${
              tab === "signup" ? "" : "bg-opacity-20"
            }`}
            style={
              tab === "signup"
                ? {
                    background: themeColor,
                    color: "#18181b",
                    boxShadow: `0 0 12px 2px ${themeColor}`,
                  }
                : { background: `${themeColor}22`, color: themeColor }
            }
            onClick={() => setTab("signup")}
          >
            Sign Up
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-semibold mb-1"
              style={{ color: themeColor }}
            >
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg px-4 py-2 bg-black/70 border-2 focus:outline-none focus:ring-2 placeholder-cyan-1000 shadow-inner transition-all duration-200"
              style={{
                borderColor: themeColor,
                color: themeColor,
                background: "#22292f",
                boxShadow: `0 0 8px 0 ${themeColor}55`,
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-1"
              style={{ color: themeColor }}
            >
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg px-4 py-2 bg-black/70 border-2 focus:outline-none focus:ring-2 placeholder-cyan-1000 shadow-inner transition-all duration-200"
              style={{
                borderColor: themeColor,
                color: themeColor,
                background: "#22292f",
                boxShadow: `0 0 8px 0 ${themeColor}55`,
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Password"
            />
          </div>
          {tab === "signup" && (
            <div>
              <label
                className="block text-sm font-semibold mb-1"
                style={{ color: themeColor }}
              >
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full rounded-lg px-4 py-2 bg-black/70 border-2 focus:outline-none focus:ring-2 placeholder-cyan-1000 shadow-inner transition-all duration-200"
                style={{
                  borderColor: themeColor,
                  color: themeColor,
                  background: "#22292f",
                  boxShadow: `0 0 8px 0 ${themeColor}55`,
                }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Repeat password"
              />
            </div>
          )}
          {error && (
            <div className="text-pink-400 text-sm font-bold animate-pulse drop-shadow-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full font-extrabold py-2 rounded-xl shadow-xl mt-2 text-lg tracking-wide hover:scale-105 transition-all duration-200 border-2"
            style={{
              background: `linear-gradient(90deg, ${themeColor} 0%, #fff 100%)`,
              color: "#18181b",
              borderColor: themeColor,
              textShadow: `0 0 8px ${themeColor}, 0 0 2px #fff`,
              boxShadow: `0 0 16px 2px ${themeColor}`,
            }}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : tab === "signin"
              ? "Sign In"
              : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};
