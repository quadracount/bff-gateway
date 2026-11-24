const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  await app.close();
  console.log('schema.gql actualizado');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
