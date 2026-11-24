import { createParamDecorator } from '@nestjs/common';

/**
 * user_id de quien hace la petición. Se envía a groups-service como requester_id.
 *
 * PROVISIONAL (Fase 2): mientras no existe el login, es un usuario fijo tomado
 * de DEV_USER_ID. En la Fase 4 se cambia solo este decorador para leer el
 * user_id del JWT que valida el guard global; los resolvers no cambian.
 */
export const CurrentUser = createParamDecorator(
  (): string => process.env.DEV_USER_ID ?? 'u-martin',
);
