import { Module } from '@nestjs/common';
import { GrpcClientsModule } from '../grpc/grpc-clients.module';
import { InternalController } from './internal.controller';

@Module({
  imports: [GrpcClientsModule],
  controllers: [InternalController],
})
export class InternalModule {}
