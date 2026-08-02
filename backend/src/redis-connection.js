import Redis from "ioredis";

function createRedisConnection() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export class RedisConnection {
  static publisher = createRedisConnection();
  static subscriber = createRedisConnection();
}
