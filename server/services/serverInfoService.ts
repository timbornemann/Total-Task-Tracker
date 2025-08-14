let activePort = 3002;
export function setActivePort(p) {
  activePort = p;
}
export function getActivePort() {
  return activePort;
}
export const publicIp = process.env.SERVER_PUBLIC_IP || null;
