import { registerAs } from "@nestjs/config";

// This function allows loading configuration from environment variables
// and provides default values.
export default registerAs("database", () => ({
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USERNAME || "postgres",
  password: process.env.DATABASE_PASSWORD || "postgres",
  name: process.env.DATABASE_NAME || "trustana_assignment",
}));
