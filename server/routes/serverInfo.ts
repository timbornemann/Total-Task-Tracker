import { Router } from "express";

export default function createServerInfoRouter({ os, activePort, publicIp }) {
  const router = Router();

  router.get("/", (req, res) => {
    const ips = [];
    const ifaces = os.networkInterfaces();
    let wifiIp = null;
    Object.entries(ifaces).forEach(([name, list]) => {
      for (const iface of list || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          ips.push(iface.address);
          if (!wifiIp && /^(wl|wlan|wi-?fi)/i.test(name)) {
            wifiIp = iface.address;
          }
        }
      }
    });
    if (publicIp && !ips.includes(publicIp)) {
      ips.push(publicIp);
      if (!wifiIp) wifiIp = publicIp;
    }
    const info = {
      ips,
      port: activePort(),
      urls: ips.map((ip) => `http://${ip}:${activePort()}/`),
      wifiIp,
      wifiUrl: wifiIp ? `http://${wifiIp}:${activePort()}/` : null,
    };
    res.json(info);
  });

  return router;
}
