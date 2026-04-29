import http from "node:http";
import express from "express";

async function main() {
  const server = http.createServer();
  const app = express();

  const PORT = process.env.PORT ?? 8000;

  app.get("/health", (req, res) =>
    res.json({
      healthy: true,
    }),
  );

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
