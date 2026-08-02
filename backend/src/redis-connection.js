import Redis from "ioredis";

function createRedisConnection() {
  return new Redis(
    process.env.REDIS_URI || {
      host: "localhost",
      port: 6379,
    },
  );
}

export class RedisConnection {
  static publisher = createRedisConnection();
  static subscriber = createRedisConnection();
}
