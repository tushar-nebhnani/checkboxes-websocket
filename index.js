import http from "node:http";
import path from "node:path";

import "dotenv/config";
import express from "express";
import { Server } from "socket.io";

const CHECKBOX_SIZE = 1008;
const state = {
  checkboxes: new Array(CHECKBOX_SIZE).fill(false),
};

async function main() {
  const PORT = process.env.PORT ?? 8000;

  const app = express();
  const server = http.createServer(app);
  const io = new Server();
  io.attach(server);

  // Socket IO Handler
  io.on("connection", (socket) => {
    console.log(`Socket connected`, { id: socket.id });

    socket.on("client:checkbox:change", (data) => {
      console.log(`[Socket:${socket.id}:client:checkbox:change]`, data);
      io.emit("server:checkbox:change", data);
      state.checkboxes[data.idx] = data.checked;
    });
  });

  // Express
  app.use(express.static(path.resolve("./public"))); // if a file is requested and it is present in the public folder you can serve it otherwise not.
  app.get("/health", (req, res) =>
    res.json({
      healthy: true,
    }),
  );

  app.get("/checkboxes", (req, res) => {
    return res.json({ checkboxes: state.checkboxes });
  });

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
