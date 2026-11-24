import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuadracountGraphQLModule } from './graphql/graphql.module';

@Module({
  imports: [QuadracountGraphQLModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
