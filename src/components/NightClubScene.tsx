import React, { useEffect, useState, useRef } from "react";
import ThreeNightClubScene from "./ThreeNightClubScene";
import { LoadingScreen } from "./LoadingScreen";
import { apiFetch } from "../utils/apiFetch";

const FLOOR_LABELS = [
  "1st floor - Party Vibes",
  "2nd floor - Boogie Wonderland",
  "3rd floor - For The Sexy People",
  "4th floor - Late Night Agenda",
];

interface NightClubSceneProps {
  floor: number;
}

const NightClubScene: React.FC<NightClubSceneProps> = ({ floor }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [remaining, setRemaining] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // Fetch subscription on mount to get remaining time for hourly plan
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch(`/user/subscription`);
        if (!res.ok) return;
        const sub = await res.json();
        if (sub.plan === "onehour" && typeof sub.remaining_time_seconds === "number") {
          setRemaining(sub.remaining_time_seconds);
        }
      } catch {}
    };
    load();
  }, []);

  // Tick every minute to update backend and UI
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) return;
    // start interval aligned to minutes
    const tick = async () => {
      try {
        const res = await apiFetch(`/payment/update-remaining`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutes: 1 })
        });
        if (res.ok) {
          const data = await res.json();
          setRemaining(data.remaining_time_seconds);
        }
      } catch {}
    };
    timerRef.current = window.setInterval(tick, 60 * 1000) as unknown as number;
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [remaining]);
  // const idx = (floor - 1) % FLOOR_LABELS.length;
  // const label = FLOOR_LABELS[idx];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ThreeNightClubScene floor={floor} onLoaded={() => setIsLoading(false)} />
      {isLoading && (
        <LoadingScreen message="Loading your club experience..." />
      )}
      {remaining !== null && (
        <div className="absolute top-6 right-6 bg-black/50 text-white px-4 py-2 rounded-lg text-sm">
          Time left: {Math.max(0, Math.floor(remaining / 60))}m {Math.max(0, remaining % 60)}s
        </div>
      )}
      <button
        onClick={async () => {
          try {
            await apiFetch(`/payment/cancel`, { method: "POST" });
          } finally {
            if (timerRef.current) window.clearInterval(timerRef.current);
            setRemaining(0);
          }
        }}
        className="absolute top-6 left-6 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
      >
        Logout / Unsubscribe
      </button>
      {/* <div className="absolute top-10 left-1/2 -translate-x-1/2 text-white text-3xl font-bold drop-shadow-lg bg-black/40 px-8 py-4 rounded-xl">
        Welcome to GROOVE!<br />
        <span className="text-lg font-normal text-purple-200">{label}</span>
      </div> */}
      {/* Add more overlays or UI as needed */}
    </div>
  );
};

export default NightClubScene;