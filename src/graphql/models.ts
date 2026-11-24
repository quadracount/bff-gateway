import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum ExpenseSource {
  MANUAL = 'MANUAL',
  ASSISTANT = 'ASSISTANT',
}

registerEnumType(ExpenseSource, {
  name: 'ExpenseSource',
  description: 'Si el gasto se creo a mano o con el asistente de texto libre',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;
}

@ObjectType()
export class AuthPayload {
  @Field()
  token: string;

  @Field(() => User)
  user: User;
}

@ObjectType()
export class Member {
  @Field(() => ID)
  userId: string;

  @Field()
  name: string;
}

@ObjectType()
export class Share {
  @Field(() => ID)
  userId: string;

  @Field()
  name: string;

  @Field(() => Int)
  amount: number;
}

@ObjectType()
export class Expense {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;

  @Field(() => Int)
  amount: number;

  @Field(() => Member)
  paidBy: Member;

  @Field(() => [Share])
  shares: Share[];

  @Field(() => ExpenseSource)
  source: ExpenseSource;

  @Field()
  createdAt: string;
}

@ObjectType()
export class MemberBalance {
  @Field(() => Member)
  member: Member;

  @Field(() => Int)
  net: number;
}

@ObjectType()
export class Transfer {
  @Field(() => Member)
  from: Member;

  @Field(() => Member)
  to: Member;

  @Field(() => Int)
  amount: number;
}

@ObjectType()
export class ActivityEntry {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  groupId: string;

  @Field(() => String, { nullable: true })
  groupName?: string;

  @Field()
  text: string;

  @Field()
  actorName: string;

  @Field()
  createdAt: string;
}

@ObjectType()
export class Group {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => [Member])
  members: Member[];

  @Field(() => Int)
  myBalance: number;

  @Field(() => [Expense])
  expenses: Expense[];

  @Field(() => [MemberBalance])
  balances: MemberBalance[];

  @Field(() => [Transfer])
  settlementPlan: Transfer[];

  @Field(() => [ActivityEntry])
  activity: ActivityEntry[];
}

@ObjectType()
export class Interpretation {
  @Field()
  phrase: string;

  @Field()
  meaning: string;
}

@ObjectType()
export class ExpenseDraft {
  @Field()
  description: string;

  @Field(() => Int)
  amount: number;

  @Field(() => Member)
  paidBy: Member;

  @Field(() => [Share])
  shares: Share[];

  @Field(() => [Interpretation])
  interpretations: Interpretation[];

  @Field()
  sumMatches: boolean;
}
