import { createMachine, StateMachine } from '@xstate/fsm';
import SubresourceNotFound from '../errors/SubresourceNotFound';
import SubscriptionInvalidStateTransition from '../errors/SubscriptionInvalidStateTransition';
import { SubscriptionEvent, DateBehaviour } from '../types';
import {
  SubscriptionEntity,
  SubscriptionState,
  SubscriptionType,
  STATE_ACTIVE,
  STATE_CANCELLED,
  STATE_CANCELLATION,
  STATE_UNPAID,
  STATE_PAUSED,
  STATE_TRIAL,
  STATE_TRIAL_ENDED,
  TYPE_SCHEDULED,
  TYPE_PRODUCT,
  TYPE_MEMBERSHIP,
  STATE_SUSPENDED,
} from '@makegoodfood/gf3-types';
import {
  ACTION_NULL_BILLING_CYCLE,
  ACTION_NEXT_CHARGE_DATE,
  EVENT_FAILED,
  EVENT_PAUSE,
  EVENT_ENDTRIAL,
  EVENT_ACTIVATE,
  EVENT_CANCELLATION,
  EVENT_CANCEL,
  EVENT_TRIAL,
  STR_SUBSCRIPTION_TYPE,
} from './constants';
import Subscription from './Subscription';

type NeverObject = Record<string, never>;

type MembershipState = {
  context: NeverObject;
  value: Exclude<SubscriptionState, typeof STATE_PAUSED | typeof STATE_SUSPENDED>;
};

// Product / Scheduled possible states
type BasicState = {
  context: NeverObject;
  value: typeof STATE_ACTIVE | typeof STATE_PAUSED | typeof STATE_UNPAID | typeof STATE_CANCELLED;
};

type Event = {
  type: SubscriptionEvent;
};

type BasicMachine = StateMachine.Machine<NeverObject, Event, BasicState>;

type MembershipMachine = StateMachine.Machine<NeverObject, Event, MembershipState>;

type SubscriptionMachine = BasicMachine | MembershipMachine;

type SubscriptionMachineState =
  | StateMachine.State<NeverObject, Event, BasicState>
  | StateMachine.State<NeverObject, Event, MembershipState>;

type Action = typeof ACTION_NULL_BILLING_CYCLE | typeof ACTION_NEXT_CHARGE_DATE;

type ActionObject = StateMachine.ActionObject<NeverObject, Event>;

type ActionMap = {
  [K in Action]: (input: SubscriptionEntity) => SubscriptionEntity;
};

type SubscriptionReducer = (
  accumulator: SubscriptionEntity,
  action: ActionObject,
) => SubscriptionEntity;

const membershipMachine = (): MembershipMachine =>
  createMachine<NeverObject, Event, MembershipState>({
    id: TYPE_MEMBERSHIP,
    initial: STATE_TRIAL,
    states: {
      [STATE_TRIAL]: {
        on: {
          [EVENT_ENDTRIAL]: STATE_TRIAL_ENDED,
          [EVENT_CANCELLATION]: STATE_CANCELLATION,
          [EVENT_TRIAL]: {},
        },
      },
      [STATE_TRIAL_ENDED]: {
        on: {
          [EVENT_ACTIVATE]: STATE_ACTIVE,
          [EVENT_CANCEL]: STATE_CANCELLED,
          [EVENT_ENDTRIAL]: {},
        },
      },
      [STATE_ACTIVE]: {
        entry: ACTION_NEXT_CHARGE_DATE,
        on: {
          [EVENT_FAILED]: STATE_UNPAID,
          [EVENT_CANCELLATION]: STATE_CANCELLATION,
          // Treating this as an on-time payment
          [EVENT_ACTIVATE]: STATE_ACTIVE,
        },
      },
      [STATE_UNPAID]: {
        on: {
          [EVENT_ACTIVATE]: STATE_ACTIVE,
          [EVENT_CANCEL]: STATE_CANCELLED,
          [EVENT_FAILED]: {},
        },
      },
      [STATE_CANCELLATION]: {
        entry: ACTION_NULL_BILLING_CYCLE,
        on: {
          [EVENT_CANCELLATION]: {},
          [EVENT_ACTIVATE]: STATE_ACTIVE,
          [EVENT_CANCEL]: STATE_CANCELLED,
        },
      },
      // Final state
      [STATE_CANCELLED]: {
        entry: ACTION_NULL_BILLING_CYCLE,
        on: {
          [EVENT_CANCEL]: {},
        },
      },
    },
  });

// For subscriptions of type Product / Scheduled
const basicMachine = (subscriptionType: SubscriptionType): BasicMachine =>
  createMachine({
    id: subscriptionType,
    initial: STATE_ACTIVE,
    states: {
      [STATE_ACTIVE]: {
        entry: ACTION_NEXT_CHARGE_DATE,
        on: {
          [EVENT_PAUSE]: STATE_PAUSED,
          [EVENT_FAILED]: STATE_UNPAID,
          [EVENT_CANCEL]: STATE_CANCELLED,
          [EVENT_CANCELLATION]: STATE_CANCELLED,
          [EVENT_ACTIVATE]: STATE_ACTIVE,
        },
      },
      [STATE_UNPAID]: {
        on: {
          [EVENT_ACTIVATE]: STATE_ACTIVE,
          [EVENT_CANCEL]: STATE_CANCELLED,
          [EVENT_FAILED]: {},
        },
      },
      [STATE_PAUSED]: {
        entry: ACTION_NULL_BILLING_CYCLE,
        on: {
          [EVENT_ACTIVATE]: STATE_ACTIVE,
          [EVENT_CANCEL]: STATE_CANCELLED,
          [EVENT_PAUSE]: {},
        },
      },
      // Final state
      [STATE_CANCELLED]: {
        entry: ACTION_NULL_BILLING_CYCLE,
        on: {
          [EVENT_CANCEL]: {},
          [EVENT_CANCELLATION]: {},
        },
      },
    },
  });

export const getSubscriptionTypeMachine = (
  subscriptionType: SubscriptionType,
): SubscriptionMachine => {
  switch (subscriptionType) {
    case TYPE_MEMBERSHIP:
      return membershipMachine();
    case TYPE_SCHEDULED:
    case TYPE_PRODUCT:
      return basicMachine(subscriptionType);
    default:
      throw new SubresourceNotFound(STR_SUBSCRIPTION_TYPE, subscriptionType);
  }
};

const transition = (
  machine: SubscriptionMachine,
  currentState: SubscriptionState,
  event: SubscriptionEvent,
): SubscriptionMachineState => {
  const nextState = machine.transition(currentState, event);
  if (!nextState.changed) {
    throw new SubscriptionInvalidStateTransition(machine.config.id as string, currentState, event);
  }
  return nextState;
};

const subscriptionReducer = (actionHandlers: ActionMap): SubscriptionReducer => (
  current: SubscriptionEntity,
  { type: action }: ActionObject,
): SubscriptionEntity => actionHandlers[action as Action](current);

const actionHandlers = ({
  nextCycle,
  now,
}: {
  now: Date;
  nextCycle: DateBehaviour['calculateNextCycle'];
}): ActionMap => {
  return {
    [ACTION_NULL_BILLING_CYCLE]: (subscription) =>
      new Subscription({ ...subscription, next_cycle: null }),
    [ACTION_NEXT_CHARGE_DATE]: (subscription) => {
      let prevCycleDate: Date;
      if (!subscription.next_cycle) {
        prevCycleDate = now;
      } else {
        prevCycleDate = subscription.next_cycle;
      }

      return new Subscription({
        ...subscription,
        next_cycle: nextCycle(
          subscription.frequency_type,
          subscription.frequency_value,
          prevCycleDate,
        ),
      });
    },
  };
};

const setNextState = (
  subscription: SubscriptionEntity,
  state: SubscriptionMachineState,
  reducer: SubscriptionReducer,
): SubscriptionEntity => {
  const { value: nextSubscriptionState, actions } = state;
  const nextSubscription = new Subscription({ ...subscription, state: nextSubscriptionState });
  return actions.reduce<SubscriptionEntity>(reducer, nextSubscription);
};

export const transitionSubscriptionState = (
  subscription: SubscriptionEntity,
  event: SubscriptionEvent,
  now: Date,
  nextCycle: DateBehaviour['calculateNextCycle'],
): SubscriptionEntity => {
  const { subscription_type: subscriptionType, state: subscriptionState } = subscription;
  const machine = getSubscriptionTypeMachine(subscriptionType);
  const nextState = transition(machine, subscriptionState, event);
  const reducer = subscriptionReducer(
    actionHandlers({
      now,
      nextCycle,
    }),
  );
  return setNextState(subscription, nextState, reducer);
};
