import { NotImplementedException } from '@nestjs/common';
import {
  Args,
  ID,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CreateExpenseInput } from './inputs';
import {
  ActivityEntry,
  AuthPayload,
  Expense,
  ExpenseDraft,
  Group,
  MemberBalance,
  Transfer,
  User,
} from './models';

// Fase 1: solo está el schema. Cada operación se implementa desde la Fase 2.
function pendiente(operacion: string, origen: string): never {
  throw new NotImplementedException(
    `${operacion} todavia no esta implementado (lo resolvera ${origen}).`,
  );
}

@Resolver(() => User)
export class AuthResolver {
  @Mutation(() => AuthPayload)
  register(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ): AuthPayload {
    void name;
    void email;
    void password;
    return pendiente('register', 'groups-service por gRPC');
  }

  @Mutation(() => AuthPayload)
  login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): AuthPayload {
    void email;
    void password;
    return pendiente('login', 'groups-service por gRPC');
  }

  @Query(() => User)
  me(): User {
    return pendiente('me', 'groups-service por gRPC');
  }
}

@Resolver(() => Group)
export class GroupResolver {
  @Query(() => [Group])
  myGroups(): Group[] {
    return pendiente('myGroups', 'groups-service por gRPC');
  }

  @Query(() => Group, { nullable: true })
  group(@Args('id', { type: () => ID }) id: string): Group | null {
    void id;
    return pendiente('group', 'groups-service por gRPC');
  }

  @Mutation(() => Group)
  createGroup(@Args('name') name: string): Group {
    void name;
    return pendiente('createGroup', 'groups-service por gRPC');
  }

  @Mutation(() => Group)
  addMember(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('email') email: string,
  ): Group {
    void groupId;
    void email;
    return pendiente('addMember', 'groups-service por gRPC');
  }

  @Mutation(() => Group)
  removeMember(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ): Group {
    void groupId;
    void userId;
    return pendiente('removeMember', 'groups-service por gRPC');
  }

  @ResolveField(() => Int)
  myBalance(@Parent() group: Group): number {
    void group;
    return pendiente('Group.myBalance', 'balances-service por gRPC');
  }

  @ResolveField(() => [Expense])
  expenses(@Parent() group: Group): Expense[] {
    void group;
    return pendiente('Group.expenses', 'groups-service por gRPC');
  }

  @ResolveField(() => [MemberBalance])
  balances(@Parent() group: Group): MemberBalance[] {
    void group;
    return pendiente('Group.balances', 'balances-service por gRPC');
  }

  @ResolveField(() => [Transfer])
  settlementPlan(@Parent() group: Group): Transfer[] {
    void group;
    return pendiente('Group.settlementPlan', 'balances-service por gRPC');
  }

  @ResolveField(() => [ActivityEntry])
  activity(
    @Parent() group: Group,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): ActivityEntry[] {
    void group;
    void limit;
    return pendiente('Group.activity', 'activity-service por RabbitMQ');
  }
}

@Resolver(() => Expense)
export class ExpenseResolver {
  @Mutation(() => Expense)
  createExpense(@Args('input') input: CreateExpenseInput): Expense {
    void input;
    return pendiente('createExpense', 'groups-service por gRPC');
  }

  @Mutation(() => ExpenseDraft)
  parseExpenseText(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('text') text: string,
    @Args('paidBy', { type: () => ID }) paidBy: string,
  ): ExpenseDraft {
    void groupId;
    void text;
    void paidBy;
    return pendiente('parseExpenseText', 'mcp-server por REST');
  }
}

@Resolver(() => Transfer)
export class PaymentResolver {
  @Mutation(() => Transfer)
  registerPayment(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('fromUserId', { type: () => ID }) fromUserId: string,
    @Args('toUserId', { type: () => ID }) toUserId: string,
    @Args('amount', { type: () => Int }) amount: number,
  ): Transfer {
    void groupId;
    void fromUserId;
    void toUserId;
    void amount;
    return pendiente('registerPayment', 'balances-service por gRPC');
  }
}

@Resolver(() => ActivityEntry)
export class ActivityResolver {
  @Query(() => [ActivityEntry])
  myActivity(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): ActivityEntry[] {
    void limit;
    return pendiente('myActivity', 'activity-service por RabbitMQ');
  }
}
