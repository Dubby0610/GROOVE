import React from "react";
import ThreeNightClubScene from "./ThreeNightClubScene";

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
  const idx = (floor - 1) % FLOOR_LABELS.length;
  const label = FLOOR_LABELS[idx];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ThreeNightClubScene floor={floor} />
      {/* <div className="absolute top-10 left-1/2 -translate-x-1/2 text-white text-3xl font-bold drop-shadow-lg bg-black/40 px-8 py-4 rounded-xl">
        Welcome to GROOVE!<br />
        <span className="text-lg font-normal text-purple-200">{label}</span>
      </div> */}
      {/* Add more overlays or UI as needed */}
    </div>
  );
};

export default NightClubScene;