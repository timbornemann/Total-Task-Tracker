import type { Request, Response } from "express";
import events from "./events.js";

const clients: Response[] = [];

export function registerClient(req: Request, res: Response): void {
  clients.push(res);
  req.on("close", () => {
    const idx = clients.indexOf(res);
    if (idx !== -1) clients.splice(idx, 1);
  });
}

export function notifyClients(): void {
  const msg = "data: update\n\n";
  clients.forEach((res) => res.write(msg));
}

events.on("data:updated", notifyClients);
