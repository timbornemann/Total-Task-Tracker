import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";

const ServiceWorkerManager: React.FC = () => {
  const { offlineCache } = useSettings();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (offlineCache) {
      const swPath = import.meta.env.DEV ? "/dev-sw.js?dev-sw" : "/sw.js";
      navigator.serviceWorker
        .register(swPath)
        .catch((err) => console.error("SW registration failed", err));
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
  }, [offlineCache]);

  return null;
};

export default ServiceWorkerManager;
