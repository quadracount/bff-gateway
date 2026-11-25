import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC } from './public.decorator';

export interface AuthUser {
  id: string;
}

export type AuthenticatedRequest = Request & { user?: AuthUser };

/** Mensaje que el frontend usa para volver a la pantalla de inicio de sesión. */
export const SESSION_EXPIRED =
  'Tu sesión expiró o no es válida. Inicia sesión de nuevo.';

/**
 * Guard global: exige `Authorization: Bearer <token>` en todo, menos en lo marcado
 * con @Public(). Deja el user_id del token en req.user para @CurrentUser().
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = requestFrom(context);
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(SESSION_EXPIRED);
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      req.user = { id: payload.sub };
      return true;
    } catch {
      throw new UnauthorizedException(SESSION_EXPIRED);
    }
  }
}

export function requestFrom(context: ExecutionContext): AuthenticatedRequest {
  if (context.getType<string>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<{
      req: AuthenticatedRequest;
    }>().req;
  }
  return context.switchToHttp().getRequest<AuthenticatedRequest>();
}
