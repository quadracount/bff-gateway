import { formatError } from './format-error';

describe('formatError', () => {
  it('traduce un 409 de Nest a CONFLICT y oculta los detalles internos', () => {
    const result = formatError({
      message: 'No se puede quitar a Diego: debe $8.000 en el grupo.',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        status: 409,
        originalError: { statusCode: 409, error: 'Conflict' },
      },
    });
    expect(result.extensions).toEqual({ code: 'CONFLICT' });
    expect(result.message).toContain('debe $8.000');
  });

  it('mantiene los códigos propios de GraphQL', () => {
    const result = formatError({
      message: 'Cannot query field "x"',
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' },
    });
    expect(result.extensions).toEqual({ code: 'GRAPHQL_VALIDATION_FAILED' });
  });

  it('usa INTERNAL_SERVER_ERROR si no hay información', () => {
    expect(formatError({ message: 'x' }).extensions).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });
});
