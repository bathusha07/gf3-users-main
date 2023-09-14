// TODO: move these interfaces into the gcf3f-lib repo

export interface Event<Payload> {
  payload: Payload;
  topic: string;
  type: string;
  version: number;
  idempotencyKey?: string;
}

export interface PubsubProducer {
  publish: <Payload>(event: Event<Payload>) => Promise<void>;
}
