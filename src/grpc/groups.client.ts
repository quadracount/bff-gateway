import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, type Observable, timeout } from 'rxjs';
import { toHttpException } from './grpc-errors';

export const GROUPS_CLIENT = 'GROUPS_CLIENT';
const TIMEOUT_MS = 5000;

// Mensajes de groups.proto (keepCase, longs: Number)
export interface GrpcMember {
  user_id: string;
  name: string;
}

export interface GrpcGroup {
  id: string;
  name: string;
  members: GrpcMember[];
  created_at: string;
}

export interface GrpcShare {
  user_id: string;
  amount: number;
}

export interface GrpcExpense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  shares: GrpcShare[];
  source: string;
  created_at: string;
}

export interface CreateExpenseRequest {
  group_id: string;
  description: string;
  amount: number;
  paid_by: string;
  shares: GrpcShare[];
  source: string;
  requester_id: string;
}

interface GroupsServiceGrpc {
  getGroup(req: {
    group_id: string;
    requester_id: string;
  }): Observable<GrpcGroup>;
  listGroupsForUser(req: {
    user_id: string;
  }): Observable<{ groups: GrpcGroup[] }>;
  createExpense(req: CreateExpenseRequest): Observable<GrpcExpense>;
  listExpenses(req: {
    group_id: string;
    requester_id: string;
  }): Observable<{ expenses: GrpcExpense[] }>;
}

/** Cliente gRPC de groups-service. Los errores salen ya traducidos para GraphQL. */
@Injectable()
export class GroupsClient implements OnModuleInit {
  private service: GroupsServiceGrpc;

  constructor(@Inject(GROUPS_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.service = this.client.getService<GroupsServiceGrpc>('GroupsService');
  }

  getGroup(groupId: string, requesterId: string): Promise<GrpcGroup> {
    return call(
      this.service.getGroup({ group_id: groupId, requester_id: requesterId }),
    );
  }

  async listGroupsForUser(userId: string): Promise<GrpcGroup[]> {
    const res = await call(this.service.listGroupsForUser({ user_id: userId }));
    return res.groups;
  }

  createExpense(req: CreateExpenseRequest): Promise<GrpcExpense> {
    return call(this.service.createExpense(req));
  }

  async listExpenses(
    groupId: string,
    requesterId: string,
  ): Promise<GrpcExpense[]> {
    const res = await call(
      this.service.listExpenses({
        group_id: groupId,
        requester_id: requesterId,
      }),
    );
    return res.expenses;
  }
}

async function call<T>(source: Observable<T>): Promise<T> {
  try {
    return await firstValueFrom(source.pipe(timeout(TIMEOUT_MS)));
  } catch (error) {
    throw toHttpException(error, 'groups-service');
  }
}
