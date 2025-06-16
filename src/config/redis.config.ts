import { registerAs } from "@nestjs/config";

// Configuration for Redis cache
export default registerAs("redis", () => ({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  ttl: parseInt(process.env.REDIS_TTL, 10) || 60 * 1000, // Default TTL: 60 seconds
}));
