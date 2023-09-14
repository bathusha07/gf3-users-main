import {
  CancellationReasonBehaviour,
  CancellationReasonRepository,
  DateBehaviour,
  GetCancellationReasonsOptions,
} from '../types';
import {
  CancellationReasonEntity,
  CancellationReasonId,
  CancellationReasonInput,
} from '@makegoodfood/gf3-types';

export default class CancellationReasonBehaviourImpl implements CancellationReasonBehaviour {
  protected cancellationReasonRepository: CancellationReasonRepository;
  protected dateBehaviour: DateBehaviour;

  public constructor({
    cancellationReasonRepository,
    dateBehaviour,
  }: {
    cancellationReasonRepository: CancellationReasonRepository;
    dateBehaviour: DateBehaviour;
  }) {
    this.cancellationReasonRepository = cancellationReasonRepository;
    this.dateBehaviour = dateBehaviour;
  }
  public createReason = async (input: CancellationReasonInput): Promise<CancellationReasonEntity> =>
    await this.cancellationReasonRepository.createReason(input);

  public updateReason = async (
    input: CancellationReasonEntity,
  ): Promise<CancellationReasonEntity> =>
    await this.cancellationReasonRepository.updateReason(input);

  public deleteReason = async (id: CancellationReasonId): Promise<void> =>
    await this.cancellationReasonRepository.deleteReason(id, this.dateBehaviour.getCurrentDate());

  public getReasons = async (
    opts?: GetCancellationReasonsOptions,
  ): Promise<CancellationReasonEntity[]> =>
    await this.cancellationReasonRepository.getReasons(opts);
}
