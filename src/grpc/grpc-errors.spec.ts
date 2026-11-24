import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { TimeoutError } from 'rxjs';
import { toHttpException } from './grpc-errors';

describe('toHttpException', () => {
  it('usa el mensaje de groups-service en INVALID_ARGUMENT', () => {
    const error = toHttpException(
      {
        code: status.INVALID_ARGUMENT,
        details: 'Las partes suman $500 y el total es $1000',
      },
      'groups-service',
    );
    expect(error).toBeInstanceOf(BadRequestException);
    expect(error.message).toBe('Las partes suman $500 y el total es $1000');
  });

  it('traduce PERMISSION_DENIED a Forbidden', () => {
    const error = toHttpException(
      { code: status.PERMISSION_DENIED, details: 'No eres miembro' },
      'groups-service',
    );
    expect(error).toBeInstanceOf(ForbiddenException);
  });

  it('trata un timeout como servicio no disponible', () => {
    const error = toHttpException(new TimeoutError(), 'balances-service');
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(error.message).toContain('balances-service no está disponible');
  });
});
