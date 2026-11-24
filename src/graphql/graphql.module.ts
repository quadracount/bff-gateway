import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { ActivityModule } from '../activity/activity.module';
import {
  ActivityResolver,
  AuthResolver,
  ExpenseResolver,
  GroupResolver,
  PaymentResolver,
} from './quadracount.resolver';

@Module({
  imports: [
    ActivityModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: false,
      graphiql: true,
    }),
  ],
  providers: [
    AuthResolver,
    GroupResolver,
    ExpenseResolver,
    PaymentResolver,
    ActivityResolver,
  ],
})
export class QuadracountGraphQLModule {}
