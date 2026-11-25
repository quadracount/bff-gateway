import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/** Clave compartida con el mcp-server (INTERNAL_API_KEY). */
export function internalApiKey(): string {
  const key = process.env.INTERNAL_API_KEY;
  if (key) return key;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Falta la variable de entorno INTERNAL_API_KEY');
  }
  new Logger('InternalApiKey').warn(
    'INTERNAL_API_KEY no definida: se usa la de desarrollo',
  );
  return 'dev-internal-key';
}

export function sameKey(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Protege /internal: solo lo puede llamar quien tenga X-Internal-Key. */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  private readonly key = internalApiKey();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (sameKey(req.header('x-internal-key') ?? '', this.key)) return true;
    throw new UnauthorizedException(
      'Falta o no es válida la clave interna (X-Internal-Key)',
    );
  }
}
