import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { InternalKeyGuard, sameKey } from './internal-key';

function contextWithKey(key?: string): ExecutionContext {
  const req = {
    header: (name: string) => (name === 'x-internal-key' ? key : undefined),
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('InternalKeyGuard', () => {
  const previous = process.env.INTERNAL_API_KEY;
  beforeAll(() => (process.env.INTERNAL_API_KEY = 'clave-de-prueba'));
  afterAll(() => (process.env.INTERNAL_API_KEY = previous));

  it('deja pasar con la clave correcta', () => {
    const guard = new InternalKeyGuard();
    expect(guard.canActivate(contextWithKey('clave-de-prueba'))).toBe(true);
  });

  it('rechaza sin clave o con otra clave', () => {
    const guard = new InternalKeyGuard();
    expect(() => guard.canActivate(contextWithKey())).toThrow(
      UnauthorizedException,
    );
    expect(() => guard.canActivate(contextWithKey('otra'))).toThrow(
      UnauthorizedException,
    );
  });

  it('compara claves de distinto largo sin fallar', () => {
    expect(sameKey('a', 'abc')).toBe(false);
    expect(sameKey('abc', 'abc')).toBe(true);
  });
});
