import http from "node:http";

import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { Server } from "socket.io";

import { AuthMiddleware } from "./auth/auth.middleware.js";
import { AuthRoutes } from "./auth/auth.routes.js";
import { AuthUtils } from "./auth/auth.utils.js";
import { Database } from "./db/db.js";
import { RedisConnection } from "./redis-connection.js";
import { ErrorHandler } from "./utils/ErrorHandler.js";

const CHECKBOX_COUNT = 1008;
const CHECKBOX_CHANGE_CHANNEL = "internal-server:checkbox:change";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const state = { checkboxes: new Array(CHECKBOX_COUNT).fill(false) };

function isValidCheckboxChange(data) {
  return (
    data != null &&
    Number.isInteger(data.idx) &&
    data.idx >= 0 &&
    data.idx < CHECKBOX_COUNT &&
    typeof data.checked === "boolean"
  );
}

async function attachRealtime(io) {
  await RedisConnection.subscriber.subscribe(CHECKBOX_CHANGE_CHANNEL);

  RedisConnection.subscriber.on("message", (channel, message) => {
    try {
      if (channel !== CHECKBOX_CHANGE_CHANNEL) return;

      const data = JSON.parse(message);
      if (!isValidCheckboxChange(data)) return;

      state.checkboxes[data.idx] = data.checked;
      io.emit("server:checkbox:change", {
        idx: data.idx,
        checked: data.checked,
      });
    } catch (err) {
      console.error("[App] Failed to process checkbox change message:", err);
    }
  });

  io.use((socket, next) => {
    try {
      const token = AuthUtils.getAccessTokenFromCookieHeader(
        socket.handshake.headers.cookie,
      );
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      socket.userId = AuthUtils.verifyAccessToken(token).sub;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected", { id: socket.id, userId: socket.userId });

    socket.on("client:checkbox:change", (data) => {
      try {
        if (!isValidCheckboxChange(data)) return;

        console.log(`[Socket:${socket.id}:client:checkbox:change]`, data);
        RedisConnection.publisher.publish(
          CHECKBOX_CHANGE_CHANNEL,
          JSON.stringify({ idx: data.idx, checked: data.checked }),
        );
      } catch (err) {
        console.error(
          `[Socket:${socket.id}] Failed to handle checkbox change:`,
          err,
        );
      }
    });
  });
}

async function start() {
  try {
    const PORT = process.env.PORT ?? 8000;

    const app = express();
    if (process.env.NODE_ENV === "production") {
      app.set("trust proxy", 1);
    }
    const server = http.createServer(app);
    const io = new Server({
      cors: {
        origin: CLIENT_ORIGIN,
        credentials: true,
      },
    });
    io.attach(server);

    await attachRealtime(io);

    app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
    app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    app.get("/health", (req, res) => res.json({ healthy: true }));

    app.get("/checkboxes", AuthMiddleware.requireAuth, (req, res) => {
      res.json({ checkboxes: state.checkboxes });
    });

    app.use("/auth", AuthRoutes.router);

    app.use((err, req, res, next) => {
      ErrorHandler.handleControllerError(err, res, "App.errorMiddleware");
    });

    try {
      await Database.ensureSchema();
    } catch (err) {
      console.error(
        "[db] Failed to ensure schema — auth routes will not work until DATABASE_URL is configured correctly:",
        err.message,
      );
    }

    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[App] Fatal startup error:", err);
    process.exit(1);
  }
}

start();
