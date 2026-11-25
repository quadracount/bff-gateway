import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { QuadracountGraphQLModule } from './graphql/graphql.module';

@Module({
  imports: [AuthModule, QuadracountGraphQLModule],
})
export class AppModule {}
