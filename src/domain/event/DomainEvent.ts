import { Event } from '../types/event';

export default class DomainEvent<Payload> implements Event<Payload> {
  public payload: Payload;
  public topic: string;
  public type: string;
  public version: number;
  public constructor(event: Event<Payload>) {
    this.payload = event.payload;
    this.topic = event.topic;
    this.type = event.type;
    this.version = event.version;
  }
}
