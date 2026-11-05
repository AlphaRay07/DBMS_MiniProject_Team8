const { MongoMemoryServer } = require('../web-app/node_modules/mongodb-memory-server');

async function start() {
  console.log('⏳ Starting local MongoDB engine...');
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'motorsport_telemetry',
    }
  });

  const uri = mongod.getUri();
  console.log(`✅ MongoDB Server is LIVE on: ${uri}`);
  console.log('Ready for queries, aggregations, and insertions.');

  process.on('SIGINT', async () => {
    await mongod.stop();
    process.exit(0);
  });
}

start().catch(err => {
  console.error('Failed to start MongoDB:', err);
  process.exit(1);
});
