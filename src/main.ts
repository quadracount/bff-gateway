import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Cierra ordenadamente con SIGTERM (por ejemplo, cuando Kubernetes reemplaza el pod)
  // en vez de esperar los 30 s de gracia hasta que lo maten.
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
