import Redis from "ioredis";

function createRedisConnection() {
  return new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_REST_TOKEN,
  });
}

export class RedisConnection {
  static publisher = createRedisConnection();
  static subscriber = createRedisConnection();
}
