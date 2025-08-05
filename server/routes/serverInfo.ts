import { Router } from "express";
import type { NetworkInterfaceInfo } from "os";

interface ServerInfoDeps {
  os: { networkInterfaces: () => NodeJS.Dict<NetworkInterfaceInfo[]> };
  activePort: () => number;
  publicIp: string | null;
}

export default function createServerInfoRouter({
  os,
  activePort,
  publicIp,
}: ServerInfoDeps) {
  const router = Router();

  router.get("/", (req, res) => {
    const ips: string[] = [];
    const ifaces = os.networkInterfaces();
    let wifiIp: string | null = null;
    Object.entries(ifaces).forEach(([name, list]) => {
      for (const iface of (list ?? []) as NetworkInterfaceInfo[]) {
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
