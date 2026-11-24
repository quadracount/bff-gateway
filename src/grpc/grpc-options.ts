import { join } from 'node:path';

export const GROUPS_PROTO = join(process.cwd(), 'protos', 'groups.proto');
export const BALANCES_PROTO = join(process.cwd(), 'protos', 'balances.proto');

/**
 * Opciones de @grpc/proto-loader. Iguales en groups-service:
 * - keepCase: los campos se llaman como en el .proto (group_id, requester_id).
 * - longs: Number: los int64 (montos en pesos) llegan como number.
 * - defaults/arrays: los campos vacíos llegan como "" / 0 / [] y no como undefined.
 */
/**
 * Si un servicio se cae, gRPC reintenta conectar esperando cada vez más
 * (hasta 2 minutos por defecto). Con un máximo de 5 s, el BFF vuelve a verlo
 * pocos segundos después de que se levanta (prueba de resiliencia de la demo).
 */
export const GRPC_CHANNEL_OPTIONS = {
  'grpc.initial_reconnect_backoff_ms': 1000,
  'grpc.max_reconnect_backoff_ms': 5000,
};

export const PROTO_LOADER_OPTIONS = {
  keepCase: true,
  longs: Number,
  enums: String,
  defaults: true,
  arrays: true,
};
