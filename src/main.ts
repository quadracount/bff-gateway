import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Cierra ordenadamente con SIGTERM (por ejemplo, cuando Kubernetes reemplaza el pod)
  // en vez de esperar los 30 s de gracia hasta que lo maten.
  app.enableShutdownHooks();
  // El frontend se sirve desde otro origen (otro puerto): el navegador necesita CORS.
  // No usa cookies (el JWT va en el header Authorization), así que no hacen falta credenciales.
  app.enableCors({
    origin: (
      process.env.CORS_ORIGINS ?? 'http://localhost:8080,http://localhost:5173'
    ).split(','),
  });
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
