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
import { ActivityService } from '../activity/activity.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { BalancesClient } from '../grpc/balances.client';
import { GroupsClient } from '../grpc/groups.client';
import { CreateExpenseInput } from './inputs';
import { memberOf, toExpense, toGroup } from './mappers';
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

// Operaciones que todavía no están implementadas (Fases 4 y 5).
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
  constructor(
    private readonly groupsClient: GroupsClient,
    private readonly balancesClient: BalancesClient,
    private readonly activityService: ActivityService,
  ) {}

  @Query(() => [Group])
  async myGroups(@CurrentUser() userId: string): Promise<Group[]> {
    const groups = await this.groupsClient.listGroupsForUser(userId);
    return groups.map(toGroup);
  }

  // groups-service verifica que el usuario sea miembro. Los field resolvers de
  // abajo solo se ejecutan sobre un grupo que ya pasó esa verificación.
  @Query(() => Group, { nullable: true })
  async group(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() userId: string,
  ): Promise<Group> {
    return toGroup(await this.groupsClient.getGroup(id, userId));
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
  async myBalance(
    @Parent() group: Group,
    @CurrentUser() userId: string,
  ): Promise<number> {
    const balances = await this.balancesClient.getGroupBalances(group.id);
    return balances.get(userId) ?? 0;
  }

  @ResolveField(() => [Expense])
  async expenses(
    @Parent() group: Group,
    @CurrentUser() userId: string,
  ): Promise<Expense[]> {
    const expenses = await this.groupsClient.listExpenses(group.id, userId);
    return expenses.map((e) => toExpense(e, group));
  }

  /** Un saldo por miembro, en el orden del grupo (0 si no tiene movimientos). */
  @ResolveField(() => [MemberBalance])
  async balances(@Parent() group: Group): Promise<MemberBalance[]> {
    const balances = await this.balancesClient.getGroupBalances(group.id);
    return group.members.map((member) => ({
      member,
      net: balances.get(member.userId) ?? 0,
    }));
  }

  @ResolveField(() => [Transfer])
  async settlementPlan(@Parent() group: Group): Promise<Transfer[]> {
    const transfers = await this.balancesClient.getSettlementPlan(group.id);
    return transfers.map((t) => ({
      from: memberOf(group, t.from_user_id),
      to: memberOf(group, t.to_user_id),
      amount: t.amount,
    }));
  }

  @ResolveField(() => [ActivityEntry])
  async activity(
    @Parent() group: Group,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<ActivityEntry[]> {
    // El grupo ya pasó por la verificación de miembro en groups-service
    const entries = await this.activityService.getFeed(group.id, limit);
    return entries.map((entry) => ({ ...entry, groupName: group.name }));
  }
}

@Resolver(() => Expense)
export class ExpenseResolver {
  constructor(private readonly groupsClient: GroupsClient) {}

  @Mutation(() => Expense)
  async createExpense(
    @Args('input') input: CreateExpenseInput,
    @CurrentUser() userId: string,
  ): Promise<Expense> {
    const expense = await this.groupsClient.createExpense({
      group_id: input.groupId,
      description: input.description,
      amount: input.amount,
      paid_by: input.paidBy,
      shares: input.shares.map((s) => ({
        user_id: s.userId,
        amount: s.amount,
      })),
      source: input.source,
      requester_id: userId,
    });
    // Los nombres de quien pagó y de cada parte salen de los miembros del grupo
    const group = toGroup(
      await this.groupsClient.getGroup(input.groupId, userId),
    );
    return toExpense(expense, group);
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
