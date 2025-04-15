import { useEffect } from 'react';
import { useDeviceInfo } from '../../utils/deviceDetector';
import { initTouchOptimizer } from '../../utils/touchOptimizer';

const TouchOptimizer = () => {
  const deviceInfo = useDeviceInfo();
  
  useEffect(() => {
    const cleanup = initTouchOptimizer({
      preventDoubleTapZoom: true,
      disableContextMenu: !deviceInfo.isDesktop,
      optimizeFastClick: true
    });

    return () => {
      cleanup();
    };
  }, [deviceInfo.isDesktop]);

  return null;
};

export default TouchOptimizer; 