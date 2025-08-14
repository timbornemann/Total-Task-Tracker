import { app } from "./app.js";
import { setActivePort } from "./services/serverInfoService.js";
import type { AddressInfo } from "net";

const port = Number(process.env.PORT) || 3002;
const server = app.listen(port, () => {
  const address = server.address() as AddressInfo;
  setActivePort(address.port);
  console.log("Server listening on port", address.port);
});
