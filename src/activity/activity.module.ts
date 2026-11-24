import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ACTIVITY_CLIENT, ACTIVITY_RPC_QUEUE } from './activity.constants';
import { ActivityService } from './activity.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ACTIVITY_CLIENT,
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
            queue: ACTIVITY_RPC_QUEUE,
            // Tiene que coincidir con la declaración de la cola en activity-service
            queueOptions: { durable: true },
          },
        }),
      },
    ]),
  ],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
