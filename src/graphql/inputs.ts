import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { ExpenseSource } from './models';

@InputType()
export class ShareInput {
  @Field(() => ID)
  userId: string;

  @Field(() => Int)
  amount: number;
}

@InputType()
export class CreateExpenseInput {
  @Field(() => ID)
  groupId: string;

  @Field()
  description: string;

  @Field(() => Int)
  amount: number;

  @Field(() => ID)
  paidBy: string;

  @Field(() => [ShareInput])
  shares: ShareInput[];

  @Field(() => ExpenseSource)
  source: ExpenseSource;
}
