import http from "node:http";
import express from "express";
import "dotenv/config";
import path from "node:path";

async function main() {
  const app = express();
  const server = http.createServer(app);

  const PORT = process.env.PORT ?? 8000;

  app.use(express.static(path.resolve("./public"))); // if a file is requested and it is present in the public folder you can serve it otherwise not.
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
