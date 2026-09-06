import { useEffect, useRef, useState } from "react";

/**
 * Full-screen overlay shown when the app is opened on a touch device
 * held in portrait orientation. Browsers don't allow a page to rotate
 * itself, so we ask the user to rotate to landscape instead.
 */
export default function RotateDevicePrompt() {
  const [show, setShow] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    const check = () => {
      const isTouch = window.matchMedia("(pointer: coarse)").matches;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShow(isTouch && isPortrait && !dismissed.current);
    };
    const onOrientationChange = () => {
      // re-show the prompt on real orientation changes
      dismissed.current = false;
      check();
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", onOrientationChange);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  const skip = () => {
    dismissed.current = true;
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="z-50 fixed inset-0 flex flex-col justify-center items-center gap-6 bg-black/90 font-mono text-white">
      <div className="text-7xl animate-pulse">📱↻</div>
      <h2 className="text-3xl text-center tracking-widest">
        ROTATE YOUR DEVICE
      </h2>
      <p className="text-neutral-400 text-center">
        This game is played in horizontal (landscape) position.
      </p>
      <button
        onClick={skip}
        className="bg-zinc-900 hover:bg-green-500 px-0 py-2 border-2 border-green-500 rounded w-48 text-green-500 hover:text-black text-lg transition-colors cursor-pointer"
      >
        Skip
      </button>
    </div>
  );
}
