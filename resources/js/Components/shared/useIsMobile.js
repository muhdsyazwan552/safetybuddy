import { useEffect, useState } from 'react';

// True when the viewport is narrower than `breakpoint` px (default: Tailwind `sm`).
export default function useIsMobile(breakpoint = 640) {
  const get = () => (typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  const [isMobile, setIsMobile] = useState(get);

  useEffect(() => {
    const onResize = () => setIsMobile(get());
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}
