export const sseClients = [];

export function registerClient(res) {
  sseClients.push(res);
  res.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
}

export function notifyClients() {
  const msg = "data: update\n\n";
  sseClients.forEach((res) => res.write(msg));
}
