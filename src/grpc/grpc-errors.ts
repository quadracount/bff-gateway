import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { status } from '@grpc/grpc-js';
import { TimeoutError } from 'rxjs';

interface GrpcError {
  code?: number;
  details?: string;
  message?: string;
}

/**
 * Convierte un error gRPC de groups-service o balances-service en un error
 * que Apollo muestra al frontend con un mensaje legible.
 */
export function toHttpException(
  error: unknown,
  service: string,
): HttpException {
  if (error instanceof HttpException) return error;
  if (error instanceof TimeoutError) {
    // Por ejemplo, el servicio está apagado: gRPC sigue reintentando conectar
    return new ServiceUnavailableException(
      `${service} no está disponible (no respondió a tiempo)`,
    );
  }
  const { code, details, message } = (error ?? {}) as GrpcError;
  const text = details || message || 'Error desconocido';

  switch (code) {
    case status.INVALID_ARGUMENT:
      return new BadRequestException(text);
    case status.NOT_FOUND:
      return new NotFoundException(text);
    case status.ALREADY_EXISTS:
    case status.FAILED_PRECONDITION:
      return new ConflictException(text);
    case status.PERMISSION_DENIED:
      return new ForbiddenException(text);
    case status.UNAUTHENTICATED:
      return new UnauthorizedException(text);
    case status.UNIMPLEMENTED:
      return new NotImplementedException(`${service}: ${text}`);
    case status.UNAVAILABLE:
    case status.DEADLINE_EXCEEDED:
      return new ServiceUnavailableException(
        `${service} no está disponible: ${text}`,
      );
    default:
      return new InternalServerErrorException(`${service}: ${text}`);
  }
}
