import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BALANCES_CLIENT, BalancesClient } from './balances.client';
import { GROUPS_CLIENT, GroupsClient } from './groups.client';
import {
  BALANCES_PROTO,
  GROUPS_PROTO,
  GRPC_CHANNEL_OPTIONS,
  PROTO_LOADER_OPTIONS,
} from './grpc-options';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: GROUPS_CLIENT,
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'groups',
            protoPath: GROUPS_PROTO,
            url: process.env.GROUPS_GRPC_URL ?? 'localhost:50051',
            loader: PROTO_LOADER_OPTIONS,
            channelOptions: GRPC_CHANNEL_OPTIONS,
          },
        }),
      },
      {
        name: BALANCES_CLIENT,
        useFactory: () => ({
          transport: Transport.GRPC,
          options: {
            package: 'balances',
            protoPath: BALANCES_PROTO,
            url: process.env.BALANCES_GRPC_URL ?? 'localhost:50052',
            loader: PROTO_LOADER_OPTIONS,
            channelOptions: GRPC_CHANNEL_OPTIONS,
          },
        }),
      },
    ]),
  ],
  providers: [GroupsClient, BalancesClient],
  exports: [GroupsClient, BalancesClient],
})
export class GrpcClientsModule {}
