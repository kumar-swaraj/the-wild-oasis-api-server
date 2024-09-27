import { createServer, Server } from 'node:http';
import createApp from './app';
import config from './lib/config/config';
import logger from './lib/logger/logger';
import { mongoConnect } from './services/mongo';

let httpServer: Server;

async function startServer() {
  try {
    logger.info('Trying to establish a connection with MongoDB...');
    await mongoConnect();
    logger.info('Connected to MongoDB!');

    const app = createApp();
    httpServer = createServer(app);

    httpServer.listen(config.port, config.hostname, () => {
      logger.info(`Server running at http://${config.hostname}:${config.port}`);
    });
  } catch (err) {
    logger.error(err);
  }
}
void startServer();
