import {
  CancellationReasonId,
  CancellationSelectionEntity,
  CancellationSelectionId,
  SubscriptionId,
  SourceType,
} from '@makegoodfood/gf3-types';

export default class CancellationSelection implements CancellationSelectionEntity {
  public id: CancellationSelectionId;
  public subscription_id: SubscriptionId;
  public reason_id: CancellationReasonId;
  public edit_value?: string | null;
  public created_at?: Date | null;
  public agent_id?: string | null;
  public category?: string | null;
  public source?: SourceType | null;

  public constructor({
    id,
    subscription_id,
    reason_id,
    edit_value,
    created_at,
    agent_id,
    category,
    source,
  }: CancellationSelectionEntity) {
    this.id = id;
    this.subscription_id = subscription_id;
    this.reason_id = reason_id;
    this.edit_value = edit_value;
    this.created_at = created_at;
    this.agent_id = agent_id;
    this.category = category;
    this.source = source;
  }
}
