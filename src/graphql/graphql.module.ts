import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'node:path';
import { ActivityModule } from '../activity/activity.module';
import { GrpcClientsModule } from '../grpc/grpc-clients.module';
import { formatError } from './format-error';
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
    GrpcClientsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'),
      sortSchema: true,
      playground: false,
      graphiql: true,
      // La petición HTTP queda en el contexto: el guard JWT lee de ahí el header Authorization
      context: ({ req }: { req: unknown }) => ({ req }),
      // Códigos de error legibles para el frontend (NOT_FOUND, CONFLICT, UNAUTHENTICATED...)
      formatError,
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
