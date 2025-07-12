import { app, setActivePort } from "./app.js";

const port = Number(process.env.PORT) || 3002;
const server = app.listen(port, () => {
  setActivePort(server.address().port);
  console.log("Server listening on port", server.address().port);
});
