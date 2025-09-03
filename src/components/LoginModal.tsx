import React from "react";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  period: { start: string; end: string } | null;
  onLogin: () => void;
  user: { id: string; email: string } | null;
  subscription?: { start_date?: string; end_date?: string; plan?: string; status?: string; remaining_time_seconds?: number } | null;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onOpenChange, period, onLogin, user, subscription }) => {
  if (!open || !period) return null;

  // Check if this is a onehour subscription
  const isOneHourPlan = subscription?.plan === "onehour";
  const remainingMinutes = subscription?.remaining_time_seconds ? Math.floor(subscription.remaining_time_seconds / 60) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0f2027] via-[#2c5364] to-[#232526] backdrop-blur-md">
      <div className="relative max-w-md w-full p-0 rounded-3xl shadow-2xl border-4 border-[#2af598] bg-[#181c2b] overflow-hidden animate-fade-in">
        {/* Neon Door Frame */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 rounded-3xl border-8 border-[#2af598] opacity-60 animate-pulse blur-xl" />
          <div className="absolute inset-0 rounded-3xl border-4 border-[#009efd] opacity-40 animate-pulse blur-2xl" />
        </div>
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-cyan-300 hover:text-white text-3xl z-[100] drop-shadow-neon"
          style={{ zIndex: 100 }}
          onClick={() => { onOpenChange(false); }}
          aria-label="Close"
        >
          ×
        </button>
        <div className="relative z-10 flex flex-col items-center p-10">
          <div className="mb-6 flex flex-col items-center">
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-[#2af598] to-[#009efd] bg-clip-text text-transparent mb-2 text-center drop-shadow-neon">
              Welcome to the Club
            </h2>
            <div className="text-base text-cyan-200 text-center font-mono tracking-wide animate-fade-in-slow">
              Step through the neon door to the night of your life
            </div>
          </div>
          {/* User & Subscription Info */}
          {(user || subscription) && (
            <div className="mb-6 w-full p-4 rounded-xl bg-[#23263a] border border-[#2af598] text-white shadow-lg animate-fade-in">
              {user && <div className="mb-1"><span className="font-semibold text-[#2af598]">User ID:</span> {user.id}</div>}
              {user && <div className="mb-1"><span className="font-semibold text-[#2af598]">Email:</span> {user.email}</div>}
              {subscription && (
                <>
                  {subscription.plan && <div className="mb-1"><span className="font-semibold text-[#2af598]">Plan:</span> {subscription.plan}</div>}
                  {subscription.status && <div className="mb-1"><span className="font-semibold text-[#2af598]">Status:</span> {subscription.status}</div>}
                  {subscription.start_date && <div className="mb-1"><span className="font-semibold text-[#2af598]">Start:</span> {new Date(subscription.start_date).toLocaleString()}</div>}
                  {subscription.end_date && <div><span className="font-semibold text-[#2af598]">Expire:</span> {new Date(subscription.end_date).toLocaleString()}</div>}
                </>
              )}
            </div>
          )}
          <div className="mb-8 w-full text-center animate-fade-in-slow">
            <div className="text-cyan-300 mb-2 font-semibold text-lg">
              {isOneHourPlan ? "Your remaining time:" : "Your valid entry period:"}
            </div>
            <div className="text-[#2af598] font-mono text-xl bg-black/30 rounded-lg px-4 py-2 border border-[#2af598] shadow-inner">
              {isOneHourPlan ? (
                remainingMinutes !== null ? (
                  <span className="text-2xl font-bold">{remainingMinutes}m</span>
                ) : (
                  <span className="text-red-400">Time loading...</span>
                )
              ) : (
                <>
                  {new Date(period.start).toLocaleString()}<br />
                  <span className="text-gray-500">to</span><br />
                  {new Date(period.end).toLocaleString()}
                </>
              )}
            </div>
          </div>
          <button
            className="w-full bg-gradient-to-r from-[#2af598] to-[#009efd] hover:from-[#009efd] hover:to-[#2af598] text-black font-extrabold py-3 px-4 rounded-2xl shadow-xl text-xl tracking-wider transition-all duration-200 drop-shadow-neon animate-glow"
            onClick={onLogin}
          >
            Enter the Club
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 