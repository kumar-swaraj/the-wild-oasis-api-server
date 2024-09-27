import crypto from 'node:crypto';
import { type Model, model, Schema, type Document } from 'mongoose';
import config from '../lib/config/config';

interface IApiKey extends Document {
  apiKeyHash: string;
  forWhom: string;
  apiExpires: Date;
  lastUsed: Date;
  isActive: boolean;
  numberOfTimesUsed: number;

  // instance method
  deactivateApiKey: () => Promise<void>;
}

interface IApiKeyModel extends Model<IApiKey> {
  // Static methods
  generateApiKey: (forWhom: string) => Promise<string | null>;
  verifyApiKey: (apiKey: string) => Promise<boolean>;
}

const apiKeySchema = new Schema<IApiKey>(
  {
    apiKeyHash: {
      type: String,
      required: true,
      select: false,
    },
    forWhom: {
      type: String,
      unique: true,
      required: [true, 'API key must be assigned to an entity.'],
    },
    apiExpires: {
      type: Date,
      required: true,
      default: () =>
        new Date(
          Date.now() + config.apiKey.expiresInDays * 24 * 60 * 60 * 1000,
        ), // 1 year
    },
    numberOfTimesUsed: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { timestamps: true },
);

// Static method to generate a new API key and hash it
apiKeySchema.statics.generateApiKey = async function (forWhom: string) {
  const existingApiKeyDoc = await this.findOne({
    apiExpires: { $gt: new Date() },
    isActive: true,
  });

  if (existingApiKeyDoc) {
    return null;
  }

  const apiKey = crypto.randomBytes(32).toString('hex');
  const apiKeyHash = crypto
    .createHmac('sha256', config.apiKey.hmacSecret)
    .update(apiKey)
    .digest('hex');

  await this.create({
    apiKeyHash,
    forWhom,
  });

  return { apiKey };
};

// Static method to verify the API key
apiKeySchema.statics.verifyApiKey = async function (apiKey: string) {
  const apiKeyHash = crypto
    .createHmac('sha256', config.apiKey.hmacSecret)
    .update(apiKey)
    .digest('hex');

  const apiKeyDoc = await this.findOne({
    apiKeyHash,
    apiExpires: { $gt: new Date() },
    isActive: true,
  });

  if (!apiKeyDoc) {
    return false;
  }

  // Update last used timestamp and increment usage count
  apiKeyDoc.lastUsed = new Date();
  apiKeyDoc.numberOfTimesUsed = apiKeyDoc.numberOfTimesUsed + 1;
  await apiKeyDoc.save();

  return true;
};

// Instance method to deactivate API Key (there is no use for it yet)
apiKeySchema.methods.deactivateApiKey = async function () {
  this.isActive = false;
  await this.save();
};

const ApiKey = model<IApiKey, IApiKeyModel>('ApiKey', apiKeySchema);

export default ApiKey;
