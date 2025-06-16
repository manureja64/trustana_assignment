import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { SeedService } from "./seed.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seeder = app.get(SeedService);
  await seeder.seedData();
  await app.close();
}
bootstrap();
