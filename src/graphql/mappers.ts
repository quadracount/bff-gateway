import type { GrpcExpense, GrpcGroup } from '../grpc/groups.client';
import { type Expense, ExpenseSource, type Group, type Member } from './models';

/** Group de groups-service -> Group de GraphQL (sin los campos calculados). */
export function toGroup(group: GrpcGroup): Group {
  return {
    id: group.id,
    name: group.name,
    members: group.members.map((m) => ({ userId: m.user_id, name: m.name })),
  };
}

/** Busca el nombre de un miembro; si ya no está en el grupo, usa su id. */
export function memberOf(group: Group, userId: string): Member {
  return (
    group.members.find((m) => m.userId === userId) ?? { userId, name: userId }
  );
}

export function toExpense(expense: GrpcExpense, group: Group): Expense {
  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    paidBy: memberOf(group, expense.paid_by),
    shares: expense.shares.map((s) => ({
      userId: s.user_id,
      name: memberOf(group, s.user_id).name,
      amount: s.amount,
    })),
    source:
      expense.source === 'ASSISTANT'
        ? ExpenseSource.ASSISTANT
        : ExpenseSource.MANUAL,
    createdAt: expense.created_at,
  };
}
