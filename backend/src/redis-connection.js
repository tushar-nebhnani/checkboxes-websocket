import Redis from "ioredis";

function createRedisConnection() {
  return new Redis(
    process.env.REDIS_URI,
    {
      family: 4, // Forces Node to use IPv4 to fix Upstash DNS resolution timeouts
      tls: {}, // Ensures the connection is encrypted, required by Upstash
    } || {
      host: "localhost",
      port: 6379,
    },
  );
}

export class RedisConnection {
  static publisher = createRedisConnection();
  static subscriber = createRedisConnection();
}
