import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { QuadracountGraphQLModule } from './graphql/graphql.module';
import { InternalModule } from './internal/internal.module';

@Module({
  imports: [AuthModule, QuadracountGraphQLModule, InternalModule],
})
export class AppModule {}
