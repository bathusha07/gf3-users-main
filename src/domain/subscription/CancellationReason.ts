import {
  CancellationReasonEntity,
  CancellationReasonId,
  CancellationReasonType,
} from '@makegoodfood/gf3-types';

export default class CancellationReason implements CancellationReasonEntity {
  public id: CancellationReasonId;
  public code: string;
  public priority: number | null;
  public is_user_visible: boolean;
  public entry_type: CancellationReasonType;
  public constructor({
    id,
    code,
    priority,
    is_user_visible,
    entry_type,
  }: CancellationReasonEntity) {
    this.id = id;
    this.code = code;
    this.priority = priority;
    this.is_user_visible = is_user_visible;
    this.entry_type = entry_type;
  }
}
