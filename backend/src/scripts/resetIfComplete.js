// Standalone script — not run by the server. Intended to be invoked manually
// or on a schedule (e.g. cron) to check whether every checkbox is ticked and,
// if so, reset the board back to all-unchecked.
//
// Usage: npm run reset-if-complete   (from backend/)

import "dotenv/config";

import { CHECKBOX_RESET_CHANNEL } from "../constants.js";
import { CheckboxesRepository } from "../db/checkboxes.repository.js";
import { Database } from "../db/db.js";
import { RedisConnection } from "../redis-connection.js";

async function main() {
  await Database.ensureSchema();

  const complete = await CheckboxesRepository.isComplete();
  if (!complete) {
    console.log("[reset-if-complete] Board is not fully checked yet — nothing to do.");
    return;
  }

  await CheckboxesRepository.resetAll();
  await RedisConnection.publisher.publish(
    CHECKBOX_RESET_CHANNEL,
    JSON.stringify({ resetAt: new Date().toISOString() }),
  );
  console.log("[reset-if-complete] All checkboxes were checked — board has been reset.");
}

main()
  .catch((err) => {
    console.error("[reset-if-complete] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Database.close();
    RedisConnection.publisher.disconnect();
    RedisConnection.subscriber.disconnect();
  });
