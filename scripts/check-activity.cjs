// Prueba de punta a punta BFF <-> activity-service por RabbitMQ.
// 1. Publica un evento miembro.agregado (dos veces, para probar que no se duplica).
// 2. Pide el feed con el mismo ActivityService que usan los resolvers (request-reply).
//
// Con docker compose levantado, desde infra-k8s:
//   docker compose exec -T bff-gateway node - < ../bff-gateway/scripts/check-activity.cjs
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const amqp = require('amqplib');
const { NestFactory } = require('@nestjs/core');

const dist = (file) => path.resolve(process.cwd(), 'dist', file);
const { ActivityModule } = require(dist('activity/activity.module'));
const { ActivityService } = require(dist('activity/activity.service'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const url = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672';
  const groupId = `g-check-${Date.now()}`;
  const event = {
    event_id: randomUUID(),
    type: 'miembro.agregado',
    occurred_at: new Date().toISOString(),
    group_id: groupId,
    data: { user_id: 'u-check', name: 'Prueba' },
  };

  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await channel.assertExchange('quadracount.events', 'topic', { durable: true });
  const body = Buffer.from(JSON.stringify(event));
  for (let i = 0; i < 2; i++) {
    channel.publish('quadracount.events', event.type, body, {
      persistent: true,
      contentType: 'application/json',
    });
  }
  await channel.close();
  await connection.close();
  console.log(`Evento publicado dos veces en el grupo ${groupId}`);

  await sleep(1000);

  const app = await NestFactory.createApplicationContext(ActivityModule, {
    logger: ['error', 'warn'],
  });
  try {
    const activity = app.get(ActivityService);
    const started = Date.now();
    const feed = await activity.getFeed(groupId, 10);
    console.log(`get_feed respondió en ${Date.now() - started} ms:`);
    console.log(JSON.stringify(feed, null, 2));
    const userFeed = await activity.getUserFeed([groupId, 'g-no-existe'], 10);

    const ok =
      feed.length === 1 &&
      feed[0].text === 'Prueba se unió al grupo' &&
      userFeed.length === 1;
    console.log(ok ? 'OK: request-reply y deduplicación funcionan' : 'FALLÓ');
    process.exitCode = ok ? 0 : 1;
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('FALLÓ:', error);
  process.exit(1);
});
