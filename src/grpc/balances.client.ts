import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, type Observable, timeout } from 'rxjs';
import { toHttpException } from './grpc-errors';

export const BALANCES_CLIENT = 'BALANCES_CLIENT';
const TIMEOUT_MS = 5000;

// Mensajes de balances.proto (keepCase, longs: Number)
export interface GrpcMemberBalance {
  user_id: string;
  net: number;
}

export interface GrpcTransfer {
  from_user_id: string;
  to_user_id: string;
  amount: number;
}

interface BalancesServiceGrpc {
  getGroupBalances(req: {
    group_id: string;
  }): Observable<{ group_id: string; balances: GrpcMemberBalance[] }>;
  getSettlementPlan(req: {
    group_id: string;
  }): Observable<{ group_id: string; transfers: GrpcTransfer[] }>;
  registerPayment(req: RegisterPaymentRequest): Observable<GrpcPayment>;
}

export interface RegisterPaymentRequest {
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  from_name: string;
  to_name: string;
}

export interface GrpcPayment {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  created_at: string;
}

/**
 * Cliente gRPC de balances-service. Solo se llama con grupos que ya pasaron
 * la verificación de miembro en groups-service.
 */
@Injectable()
export class BalancesClient implements OnModuleInit {
  private service: BalancesServiceGrpc;

  constructor(@Inject(BALANCES_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.service =
      this.client.getService<BalancesServiceGrpc>('BalancesService');
  }

  /** Saldo neto por user_id. Los miembros sin movimientos no aparecen. */
  async getGroupBalances(groupId: string): Promise<Map<string, number>> {
    const res = await call(
      this.service.getGroupBalances({ group_id: groupId }),
    );
    return new Map(res.balances.map((b) => [b.user_id, b.net]));
  }

  async getSettlementPlan(groupId: string): Promise<GrpcTransfer[]> {
    const res = await call(
      this.service.getSettlementPlan({ group_id: groupId }),
    );
    return res.transfers;
  }

  registerPayment(req: RegisterPaymentRequest): Promise<GrpcPayment> {
    return call(this.service.registerPayment(req));
  }
}

async function call<T>(source: Observable<T>): Promise<T> {
  try {
    return await firstValueFrom(source.pipe(timeout(TIMEOUT_MS)));
  } catch (error) {
    throw toHttpException(error, 'balances-service');
  }
}
