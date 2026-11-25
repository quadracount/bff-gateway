import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { requestFrom, SESSION_EXPIRED } from './jwt-auth.guard';

/**
 * user_id de quien hace la petición, sacado del JWT que validó JwtAuthGuard.
 * Se envía a groups-service como requester_id. Nunca viene de un argumento.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const user = requestFrom(context).user;
    if (!user) throw new UnauthorizedException(SESSION_EXPIRED);
    return user.id;
  },
);
