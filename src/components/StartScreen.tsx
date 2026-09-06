import { useState } from "react";

interface StartScreenProps {
  onStart: () => void;
}

const buttonClass =
  "w-56 cursor-pointer rounded border-2 border-green-500 bg-zinc-900 px-0 py-3 text-lg text-green-500 transition-colors hover:bg-green-500 hover:text-black";

export default function StartScreen({ onStart }: StartScreenProps) {
  const [error, setError] = useState<string | null>(null);

  const handleExit = () => {
    // window.close() only works on windows opened by script in most browsers,
    // so fall back to a message.
    window.close();
    setError("You can close this tab now.");
  };

  return (
    <div className="flex flex-col justify-center items-center gap-4 h-full font-mono text-white">
      <h1 className="text-white text-5xl tracking-widest">BLASTER</h1>
      <button onClick={onStart} className={buttonClass}>
        Start Game
      </button>
      <button
        onClick={error ? () => setError(null) : handleExit}
        className={buttonClass}
      >
        Exit Game
      </button>
      {error && <p className="text-neutral-400">{error}</p>}
    </div>
  );
}
