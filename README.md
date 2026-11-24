# bff-gateway

API Gateway en NestJS. Es lo único que ve el frontend, por GraphQL en `/graphql` (puerto 3000).

## Con quién habla

- groups-service y balances-service por gRPC (copias de los `.proto` en `protos/`, clientes en `src/grpc/`). Los errores gRPC se traducen a errores GraphQL legibles (`src/grpc/grpc-errors.ts`). Si un servicio se cae, el BFF lo vuelve a ver a los pocos segundos de que se levante (reintento máximo cada 5 s).
- activity-service por RabbitMQ, con `activity.get_feed` y `activity.get_user_feed` (`src/activity/`). Si no responde en 5 s, la consulta falla con un error 503 en vez de quedarse esperando.
- mcp-server por REST, para `parseExpenseText`.

## Schema

El schema se define en código (`src/graphql/`) y el SDL generado queda en `schema.gql`, que se commitea para revisar los cambios. Para regenerarlo:

```bash
pnpm schema
```

Implementado (Fase 2): `myGroups`, `group` con todos sus campos (`expenses`, `myBalance`, `balances`, `settlementPlan`, `activity`) y `createExpense`. El resto lanza `NotImplementedException` hasta las Fases 4 y 5.

Todo pide `Authorization: Bearer <token>` menos `register` y `login`. El usuario sale del token y se manda a groups-service como `requester_id`.

**Provisional hasta la Fase 4:** todavía no hay login, así que `@CurrentUser()` (`src/auth/current-user.decorator.ts`) devuelve el usuario de `DEV_USER_ID`. En la Fase 4 solo cambia ese decorador.

## REST interno

Para el mcp-server, con el header `X-Internal-Key`:

- `GET /internal/groups/:groupId/members`
- `GET /internal/groups/:groupId/balances`

## Contratos

`protos/groups.proto` y `protos/balances.proto` son copias. Los originales están en groups-service y balances-service y tienen que ser idénticos:

```bash
# desde la carpeta con todos los repos
diff groups-service/protos/groups.proto bff-gateway/protos/groups.proto
diff balances-service/protos/balances.proto bff-gateway/protos/balances.proto
```

## Variables de entorno

| Variable | Ejemplo |
|---|---|
| `PORT` | `3000` |
| `JWT_SECRET` | secreto |
| `INTERNAL_API_KEY` | secreto |
| `GROUPS_GRPC_URL` | `groups-service:50051` |
| `BALANCES_GRPC_URL` | `balances-service:50052` |
| `RABBITMQ_URL` | `amqp://rabbitmq:5672` |
| `MCP_SERVER_URL` | `http://mcp-server:3001` |
| `DEV_USER_ID` | `u-martin` (provisional, hasta el login de la Fase 4) |

## Correr

```bash
pnpm install --frozen-lockfile
pnpm start:dev
```

Antes de hacer push: `pnpm run lint && pnpm test && pnpm build`. Los tests necesitan Node 24.

## Probar la conexión con activity-service

Con el `docker-compose.yml` de infra-k8s levantado, desde `infra-k8s`:

```bash
docker compose exec -T bff-gateway node - < ../bff-gateway/scripts/check-activity.cjs
```

Publica un evento dos veces y pide el feed por request-reply. Tiene que terminar con `OK`.
