import { useEffect, useState } from 'react';

/**
 * Full-screen overlay shown when the app is opened on a touch device
 * held in portrait orientation. Browsers don't allow a page to rotate
 * itself, so we ask the user to rotate to landscape instead.
 */
export default function RotateDevicePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShow(isTouch && isPortrait);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-black/90 font-mono text-white">
      <div className="animate-pulse text-7xl">📱↻</div>
      <h2 className="text-3xl tracking-widest">ROTATE YOUR DEVICE</h2>
      <p className="text-neutral-400">This game is played in horizontal (landscape) position.</p>
    </div>
  );
}
