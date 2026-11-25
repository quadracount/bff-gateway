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

`parseExpenseText` verifica que seas miembro del grupo y le pide el borrador al mcp-server (`src/internal/mcp-server.client.ts`, espera hasta `MCP_TIMEOUT_MS`, 60 s por defecto). Los nombres y si la suma cuadra se toman del grupo verificado, no del borrador.

Todo pide `Authorization: Bearer <token>` menos `register` y `login`. El usuario sale del token y se manda a groups-service como `requester_id`.

## Autenticación

- `register` y `login` piden a groups-service que cree o verifique al usuario, y el BFF firma un JWT (`@nestjs/jwt`, `JWT_SECRET`, expira en 24 horas) con el `user_id` en `sub`.
- Un guard global (`src/auth/jwt-auth.guard.ts`) exige `Authorization: Bearer <token>` en todo lo que no tenga `@Public()` (solo `register` y `login`).
- `@CurrentUser()` saca el `user_id` del token. Nunca viene de un argumento.
- `registerPayment` solo acepta pagos en los que participa quien inició sesión, entre miembros del grupo.

## Errores

`src/graphql/format-error.ts` deja en cada error solo el mensaje y `extensions.code`: `UNAUTHENTICATED` (token inválido o expirado: el frontend vuelve al login), `FORBIDDEN`, `NOT_FOUND`, `CONFLICT` (por ejemplo, quitar a un miembro con saldo), `BAD_USER_INPUT` o `SERVICE_UNAVAILABLE`.

## REST interno

Para el mcp-server (`src/internal/`). Piden dos headers: `X-Internal-Key` y `X-Requester-Id`, el usuario a cuyo nombre se consulta. Ese id va a groups-service como `requester_id`, así que la verificación de miembro es la misma que en GraphQL.

- `GET /internal/groups/:groupId/members` → `[{ userId, name }]`
- `GET /internal/groups/:groupId/balances` → `[{ userId, name, net }]`

El BFF también manda `X-Internal-Key` al llamar a `/automation/parse-expense`.

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
| `CORS_ORIGINS` | `http://localhost:8080,http://localhost:5173` (de dónde puede llamar el navegador) |

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
