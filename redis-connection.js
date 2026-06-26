import Redis from "ioredis";

function createRedisConnection() {
  return new Redis(
    process.env.REDIS_URI || {
      host: "localhost",
      port: 6379,
    },
  );
}

export const publisher = createRedisConnection();
export const subscriber = createRedisConnection();
