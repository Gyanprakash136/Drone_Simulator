import { useState, useEffect } from 'react';

export function useKeyboard() {
  const [keys, setKeys] = useState({
    w: false, s: false, a: false, d: false, 
    q: false, e: false, // Added yaw
    ArrowUp: false, ArrowDown: false,
    space: false, // For stabilization toggle or reset
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys((prev) => ({ ...prev, [e.key]: true }));
    };
    const handleKeyUp = (e) => {
      setKeys((prev) => ({ ...prev, [e.key]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
}
