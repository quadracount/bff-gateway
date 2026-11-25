import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { BalancesClient } from '../grpc/balances.client';
import { GroupsClient } from '../grpc/groups.client';
import { InternalKeyGuard } from './internal-key';

function requester(value: string | undefined): string {
  if (!value) throw new BadRequestException('Falta el header X-Requester-Id');
  return value;
}

/**
 * REST interno para el mcp-server. No usa JWT: lo llama otro servicio con
 * X-Internal-Key, a nombre del usuario de X-Requester-Id. groups-service
 * verifica que ese usuario sea miembro del grupo, igual que en GraphQL.
 */
@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/groups/:groupId')
export class InternalController {
  constructor(
    private readonly groupsClient: GroupsClient,
    private readonly balancesClient: BalancesClient,
  ) {}

  @Get('members')
  async members(
    @Param('groupId') groupId: string,
    @Headers('x-requester-id') requesterId?: string,
  ) {
    const group = await this.groupsClient.getGroup(
      groupId,
      requester(requesterId),
    );
    return group.members.map((m) => ({ userId: m.user_id, name: m.name }));
  }

  @Get('balances')
  async balances(
    @Param('groupId') groupId: string,
    @Headers('x-requester-id') requesterId?: string,
  ) {
    const group = await this.groupsClient.getGroup(
      groupId,
      requester(requesterId),
    );
    const balances = await this.balancesClient.getGroupBalances(groupId);
    return group.members.map((m) => ({
      userId: m.user_id,
      name: m.name,
      net: balances.get(m.user_id) ?? 0,
    }));
  }
}
