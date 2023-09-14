#!/usr/bin/env node
/*
* This script creates the topics needed from the service and logs them to stdout for local development.
* This provides some visibility into the messages being published on the local docker-compose setup..
*
* This script requires the following env vars to run:
*   PUBSUB_EMULATOR_HOST: Network location for the emulator host
*   GOOGLE_CLOUD_PROJECT: literally any string value, the emulator doesn't require a real project
*/

const { PubSub } = require('@google-cloud/pubsub');
const topics = require('../src/config/pubsub/pubsub_topics.json');

const pubsub = new PubSub();

function main() {
  Promise.all(Object.values(topics).map(bootstrapListeners))
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
}

function bootstrapListeners(topicName) {
  return createTopic(topicName).then(createSubscription).then(listenSubscription);
}

async function createTopic(topicName) {
  void await pubsub.createTopic(topicName);
  return topicName;
}

async function createSubscription(topicName) {
  const subscriptionName = `${topicName}-listener`;
  void await pubsub.createSubscription(topicName, subscriptionName);
  return subscriptionName;
}

function listenSubscription(subscriptionName) {
  const subscription = pubsub.subscription(subscriptionName);
  console.log(`Created listener ${subscriptionName}`);
  const messageHandler = message => {
    console.log(JSON.stringify({
      subscription: subscriptionName,
      envelope: JSON.parse(message.data.toString())
    }));
    message.ack();
  };
  subscription.on('message', messageHandler);
  return subscriptionName;
}

main();
