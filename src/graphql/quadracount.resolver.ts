import { BadRequestException, ForbiddenException } from '@nestjs/common';
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
import { JwtService } from '@nestjs/jwt';
import { ActivityService } from '../activity/activity.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { BalancesClient } from '../grpc/balances.client';
import { GroupsClient, type GrpcUser } from '../grpc/groups.client';
import { McpServerClient } from '../internal/mcp-server.client';
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

@Resolver(() => User)
export class AuthResolver {
  constructor(
    private readonly groupsClient: GroupsClient,
    private readonly jwt: JwtService,
  ) {}

  @Public()
  @Mutation(() => AuthPayload)
  async register(
    @Args('name') name: string,
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    const user = await this.groupsClient.registerUser(name, email, password);
    return this.authPayload(user);
  }

  @Public()
  @Mutation(() => AuthPayload)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthPayload> {
    const user = await this.groupsClient.verifyCredentials(email, password);
    return this.authPayload(user);
  }

  @Query(() => User)
  me(@CurrentUser() userId: string): Promise<User> {
    return this.groupsClient.getUser(userId);
  }

  /** JWT firmado por el BFF con el user_id (expira en 24 horas). */
  private async authPayload(user: GrpcUser): Promise<AuthPayload> {
    const token = await this.jwt.signAsync({ sub: user.id });
    return { token, user };
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
  async createGroup(
    @Args('name') name: string,
    @CurrentUser() userId: string,
  ): Promise<Group> {
    return toGroup(await this.groupsClient.createGroup(name, userId));
  }

  @Mutation(() => Group)
  async addMember(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('email') email: string,
    @CurrentUser() userId: string,
  ): Promise<Group> {
    return toGroup(await this.groupsClient.addMember(groupId, email, userId));
  }

  /** Si el miembro tiene saldo, groups-service responde FAILED_PRECONDITION (409). */
  @Mutation(() => Group)
  async removeMember(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('userId', { type: () => ID }) memberId: string,
    @CurrentUser() userId: string,
  ): Promise<Group> {
    return toGroup(
      await this.groupsClient.removeMember(groupId, memberId, userId),
    );
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
  constructor(
    private readonly groupsClient: GroupsClient,
    private readonly mcpServer: McpServerClient,
  ) {}

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

  /**
   * El mcp-server interpreta el texto y devuelve un borrador; no se guarda nada.
   * Primero se verifica que seas miembro, y los nombres y la suma se toman del
   * grupo verificado, no del borrador.
   */
  @Mutation(() => ExpenseDraft)
  async parseExpenseText(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('text') text: string,
    @Args('paidBy', { type: () => ID }) paidBy: string,
    @CurrentUser() userId: string,
  ): Promise<ExpenseDraft> {
    const trimmed = text.trim();
    if (!trimmed) throw new BadRequestException('Escribe el gasto');
    if (trimmed.length > 1000) {
      throw new BadRequestException(
        'El texto es muy largo (máximo 1000 caracteres)',
      );
    }

    const group = toGroup(await this.groupsClient.getGroup(groupId, userId));
    if (!group.members.some((m) => m.userId === paidBy)) {
      throw new BadRequestException('Quien pagó no es miembro del grupo');
    }

    const draft = await this.mcpServer.parseExpense({
      groupId,
      text: trimmed,
      paidBy,
      requesterId: userId,
    });
    return {
      description: draft.description,
      amount: draft.amount,
      paidBy: memberOf(group, draft.paidBy.userId),
      shares: draft.shares.map((s) => ({
        userId: s.userId,
        name: memberOf(group, s.userId).name,
        amount: s.amount,
      })),
      interpretations: draft.interpretations,
      sumMatches:
        draft.shares.reduce((sum, s) => sum + s.amount, 0) === draft.amount,
    };
  }
}

@Resolver(() => Transfer)
export class PaymentResolver {
  constructor(
    private readonly groupsClient: GroupsClient,
    private readonly balancesClient: BalancesClient,
  ) {}

  /**
   * Regla de negocio: solo se registra un pago en el que participa quien
   * inició sesión. Ambos tienen que ser miembros del grupo.
   */
  @Mutation(() => Transfer)
  async registerPayment(
    @Args('groupId', { type: () => ID }) groupId: string,
    @Args('fromUserId', { type: () => ID }) fromUserId: string,
    @Args('toUserId', { type: () => ID }) toUserId: string,
    @Args('amount', { type: () => Int }) amount: number,
    @CurrentUser() userId: string,
  ): Promise<Transfer> {
    if (userId !== fromUserId && userId !== toUserId) {
      throw new ForbiddenException(
        'Solo puedes registrar pagos en los que participas',
      );
    }
    const group = toGroup(await this.groupsClient.getGroup(groupId, userId));
    const from = group.members.find((m) => m.userId === fromUserId);
    const to = group.members.find((m) => m.userId === toUserId);
    if (!from || !to) {
      throw new BadRequestException(
        'Quien paga y quien recibe tienen que ser miembros del grupo',
      );
    }
    const payment = await this.balancesClient.registerPayment({
      group_id: group.id,
      from_user_id: from.userId,
      to_user_id: to.userId,
      amount,
      from_name: from.name,
      to_name: to.name,
    });
    return { from, to, amount: payment.amount };
  }
}

@Resolver(() => ActivityEntry)
export class ActivityResolver {
  constructor(
    private readonly groupsClient: GroupsClient,
    private readonly activityService: ActivityService,
  ) {}

  /** Feed combinado de todos los grupos del usuario (pantalla de Inicio). */
  @Query(() => [ActivityEntry])
  async myActivity(
    @CurrentUser() userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<ActivityEntry[]> {
    const groups = await this.groupsClient.listGroupsForUser(userId);
    if (groups.length === 0) return [];
    const names = new Map(groups.map((g) => [g.id, g.name]));
    const entries = await this.activityService.getUserFeed(
      groups.map((g) => g.id),
      limit,
    );
    return entries.map((entry) => ({
      ...entry,
      groupName: names.get(entry.groupId),
    }));
  }
}
