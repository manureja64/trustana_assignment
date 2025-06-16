import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import databaseConfig from "./src/config/database.config"; // Adjust path as needed
import * as path from "path"; // Import path module

dotenv.config({ path: ".env" }); // Load environment variables from .env

const config = databaseConfig(); // Get the configuration values

export default new DataSource({
  type: "postgres",
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.name,
  entities: [
    // Dynamically load entities based on NODE_ENV for ormconfig as well
    process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "**", "*.entity.js")
      : path.join(process.cwd(), "src", "**", "*.entity.ts"),
  ],
  migrations: [__dirname + "/migrations/**/*{.ts,.js}"],
  synchronize: false, // Set to false for production, use migrations instead
  logging: true,
});
