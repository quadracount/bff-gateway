import type { GraphQLFormattedError } from 'graphql';

/** Código GraphQL (extensions.code) según el estado HTTP de la excepción de Nest. */
const CODES: Record<number, string> = {
  400: 'BAD_USER_INPUT',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT', // p. ej. quitar a un miembro que tiene saldo, o un correo ya registrado
  501: 'NOT_IMPLEMENTED',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Deja en cada error solo el mensaje y un código que el frontend puede usar
 * (por ejemplo, UNAUTHENTICATED para volver a la pantalla de inicio de sesión).
 * No se envían detalles internos (originalError, stacktrace).
 */
export function formatError(
  formatted: GraphQLFormattedError,
): GraphQLFormattedError {
  const extensions = formatted.extensions ?? {};
  const original = extensions.originalError as
    { statusCode?: number } | undefined;
  const status =
    original?.statusCode ??
    (typeof extensions.status === 'number' ? extensions.status : undefined);
  const code =
    (status !== undefined ? CODES[status] : undefined) ??
    (typeof extensions.code === 'string'
      ? extensions.code
      : 'INTERNAL_SERVER_ERROR');
  return {
    message: formatted.message,
    locations: formatted.locations,
    path: formatted.path,
    extensions: { code },
  };
}
