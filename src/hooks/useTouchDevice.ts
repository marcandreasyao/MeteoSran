import { useState, useEffect } from 'react';

export function useTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    setIsTouchDevice(checkTouch());

    // Optional: listen to resize or change to detect dynamically if needed
    const handleResize = () => {
      setIsTouchDevice(checkTouch());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isTouchDevice;
}
