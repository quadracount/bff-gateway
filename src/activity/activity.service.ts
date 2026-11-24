import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ACTIVITY_CLIENT, ACTIVITY_TIMEOUT_MS } from './activity.constants';

/** Entrada tal como la responde activity-service (sin el nombre del grupo). */
export interface ActivityEntryDto {
  id: string;
  groupId: string;
  text: string;
  actorName: string;
  createdAt: string;
}

/** Cliente de activity-service por RabbitMQ (request-reply en la cola activity.rpc). */
@Injectable()
export class ActivityService {
  constructor(@Inject(ACTIVITY_CLIENT) private readonly client: ClientProxy) {}

  getFeed(groupId: string, limit?: number): Promise<ActivityEntryDto[]> {
    return this.send('activity.get_feed', { groupId, limit });
  }

  getUserFeed(groupIds: string[], limit?: number): Promise<ActivityEntryDto[]> {
    return this.send('activity.get_user_feed', { groupIds, limit });
  }

  private async send(
    pattern: string,
    data: object,
  ): Promise<ActivityEntryDto[]> {
    try {
      return await firstValueFrom(
        this.client
          .send<ActivityEntryDto[]>(pattern, data)
          .pipe(timeout(ACTIVITY_TIMEOUT_MS)),
      );
    } catch (error) {
      throw new ServiceUnavailableException(
        `activity-service no respondió ${pattern}: ${describe(error)}`,
      );
    }
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return JSON.stringify(error);
}
