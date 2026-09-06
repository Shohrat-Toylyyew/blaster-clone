import { useState } from "react";
import StartScreen from "./components/StartScreen";
import RotateDevicePrompt from "./components/RotateDevicePrompt";
import Game from "./game/Game";

export default function App() {
  const [screen, setScreen] = useState<"menu" | "game">("menu");

  return (
    <>
      <RotateDevicePrompt />
      {screen === "menu" ? (
        <div className="flex flex-col justify-center items-center gap-4 bg-[url('/night-sky.webp')] bg-black bg-cover bg-no-repeat bg-center h-full font-mono text-white">
          <StartScreen onStart={() => setScreen("game")} />
        </div>
      ) : (
        <Game onExit={() => setScreen("menu")} />
      )}
    </>
  );
}
