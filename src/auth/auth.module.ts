import { Logger, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta la variable de entorno JWT_SECRET');
  }
  // Solo para desarrollo y para generar schema.gql sin configurar nada
  new Logger('AuthModule').warn(
    'JWT_SECRET no definido: se usa uno de desarrollo',
  );
  return 'solo-desarrollo-no-usar-en-produccion';
}

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: jwtSecret(),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  // Guard global: protege todo el schema GraphQL salvo lo marcado con @Public()
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AuthModule {}
