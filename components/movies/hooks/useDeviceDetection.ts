import { useState, useEffect } from "react";

function useDeviceDetection(mobileBreakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [mobileBreakpoint]);

  return { isMobile };
}

export default useDeviceDetection;
