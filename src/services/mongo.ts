import mongoose from 'mongoose';
import config from '../lib/config/config';

export async function mongoConnect() {
  await mongoose.connect(config.mongoose.url, {
    serverApi: {
      version: '1',
      strict: true,
      deprecationErrors: true,
    },
  });
}

export async function mongoDisconnect() {
  await mongoose.disconnect();
}
