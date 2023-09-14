import { ClientConfig } from '@google-cloud/pubsub';
import topics from './pubsub_topics.json';

// Use the keyfile only if CLOUD_KEY_FILENAME is defined. If not, then
// use ADC to authenticate with GCP (preferred for non-local envs) by passing undefined
const clientConfig: ClientConfig | undefined = process.env.GOOGLE_CLOUD_KEY_FILENAME
  ? {
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILENAME,
    }
  : undefined;

export default {
  topics,
  clientConfig,
};
