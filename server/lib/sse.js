const clients = [];

export function registerClient(req, res) {
  clients.push(res);
  req.on("close", () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
}

export function notifyClients() {
  const msg = "data: update\n\n";
  clients.forEach((res) => res.write(msg));
}
