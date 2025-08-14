import { Router } from "express";
import os, { type NetworkInterfaceInfo } from "os";
import { getActivePort, publicIp } from "../services/serverInfoService.js";

const router = Router();

router.get("/", (req, res) => {
  const ips: string[] = [];
  const ifaces = os.networkInterfaces() as NodeJS.Dict<NetworkInterfaceInfo[]>;
  let wifiIp: string | null = null;
  Object.entries(ifaces).forEach(([name, list]) => {
    for (const iface of (list as NetworkInterfaceInfo[]) || []) {
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
  const port = getActivePort();
  const info = {
    ips,
    port,
    urls: ips.map((ip) => `http://${ip}:${port}/`),
    wifiIp,
    wifiUrl: wifiIp ? `http://${wifiIp}:${port}/` : null,
  };
  res.json(info);
});

export default router;
