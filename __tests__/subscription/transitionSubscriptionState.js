const awilix = require('awilix');
const Subscription = require('../../domain/subscription/entity');
const generateSubscription = require('../../factories/subscription');
const {
  transitionSubscriptionState,
} = require('../../domain/subscription/transitionSubscriptionState');
const {
  EVENT_FAILED,
  EVENT_PAUSE,
  EVENT_TRIAL,
  EVENT_ENDTRIAL,
  EVENT_ACTIVATE,
  EVENT_CANCELLATION,
  EVENT_CANCEL,

  STATE_ACTIVE,
  STATE_CANCELLED,
  STATE_CANCELLATION,
  STATE_UNPAID,
  STATE_PAUSED,
  STATE_TRIAL,
  STATE_TRIAL_ENDED,
  STATE_SUSPENDED,

  TYPE_PRODUCT,
  TYPE_MEMBERSHIP,
  TYPE_SCHEDULED,
} = require('../../domain/subscription/constants');


const SubscriptionWithType = (subscription, subscription_type) => new Subscription({
  ...subscription,
  subscription_type
});
const SubscriptionWithState = (subscription, state) => new Subscription({
  ...subscription,
  state
});

describe('transitionSubscriptionState', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });

  // Tests will compare this value for reference instead of value. This is okay
  // for now since we are only checking if the calculateNextCycleBehaviour
  // function is called and not the actual behaviour.
  const nextCycleDateMock = new Date(Date.UTC(1972, 0, 1));
  beforeEach(() => {
    let calculateNextCycleBehaviourMock = jest.fn().mockImplementation(() => nextCycleDateMock);
    let getCurrentDateBehaviourMock = jest.fn().mockImplementation(() => nextCycleDateMock);
    container.register({
      transitionSubscriptionStateBehaviour: awilix.asFunction(transitionSubscriptionState),
      calculateNextCycleBehaviour: awilix.asFunction(() => calculateNextCycleBehaviourMock),
      getCurrentDateBehaviour: awilix.asFunction(() => getCurrentDateBehaviourMock),
    });
  });

  const validTransitions = [
    // Membership subscription tests
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_TRIAL,
      event: EVENT_ENDTRIAL,
      want: {
        state: STATE_TRIAL_ENDED,
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_TRIAL_ENDED,
      event: EVENT_CANCEL,
      want: {
        state: STATE_CANCELLED,
        next_cycle: null,
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_TRIAL_ENDED,
      event: EVENT_ACTIVATE,
      want: {
        state: STATE_ACTIVE,
        next_cycle: nextCycleDateMock,
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_ACTIVE,
      event: EVENT_ACTIVATE,
      want: {
        state: STATE_ACTIVE,
        next_cycle: nextCycleDateMock,
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_ACTIVE,
      event: EVENT_FAILED,
      want: {
        state: STATE_UNPAID,
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_ACTIVE,
      event: EVENT_CANCELLATION,
      want: {
        state: STATE_CANCELLATION,
        next_cycle: null,
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_UNPAID,
      event: EVENT_ACTIVATE,
      want: {
        state: STATE_ACTIVE,
        next_cycle: nextCycleDateMock,
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_UNPAID,
      event: EVENT_CANCEL,
      want: {
        state: STATE_CANCELLED,
        next_cycle: null,
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_CANCELLATION,
      event: EVENT_CANCEL,
      want: {
        state: STATE_CANCELLED,
        next_cycle: null
      },
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_CANCELLATION,
      event: EVENT_ACTIVATE,
      want: {
        state: STATE_ACTIVE,
        next_cycle: nextCycleDateMock,
      },
    },

    // Product / Scheduled tests
    {
      type: TYPE_PRODUCT,
      state: STATE_ACTIVE,
      event: EVENT_FAILED,
      want: {
        state: STATE_UNPAID,
      },
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_ACTIVE,
      event: EVENT_CANCEL,
      want: {
        state: STATE_CANCELLED,
        next_cycle: null,
      },
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_ACTIVE,
      event: EVENT_PAUSE,
      want: {
        state: STATE_PAUSED,
        next_cycle: null,
      },
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_UNPAID,
      event: EVENT_ACTIVATE,
      want: {
        state: STATE_ACTIVE,
        next_cycle: nextCycleDateMock,
      },
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_UNPAID,
      event: EVENT_CANCEL,
      want: {
        state: STATE_CANCELLED,
        next_cycle: null,
      },
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_PAUSED,
      event: EVENT_CANCEL,
      want: {
        state: STATE_CANCELLED,
        next_cycle: null,
      },
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_PAUSED,
      event: EVENT_ACTIVATE,
      want: {
        state: STATE_ACTIVE,
        next_cycle: nextCycleDateMock,
      }
    }
  ];

  const invalidTransitions = [
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_TRIAL,
      event: EVENT_CANCEL,
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_ACTIVE,
      event: EVENT_ENDTRIAL
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_CANCELLED,
      event: EVENT_ACTIVATE,
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_CANCELLATION,
      event: EVENT_TRIAL,
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_TRIAL,
      event: EVENT_CANCEL,
    },


    // This covers Product / Scheduled since they have the same state charts
    {
      type: TYPE_PRODUCT,
      state: STATE_PAUSED,
      event: EVENT_FAILED,
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_CANCELLED,
      event: EVENT_ACTIVATE,
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_CANCELLED,
      event: EVENT_ACTIVATE,
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_UNPAID,
      event: EVENT_PAUSE,
    },
  ];

  const idempotentTransitions = [
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_TRIAL,
      event: EVENT_TRIAL,
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_TRIAL_ENDED,
      event: EVENT_ENDTRIAL,
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_UNPAID,
      event: EVENT_FAILED,
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_CANCELLATION,
      event: EVENT_CANCELLATION,
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_CANCELLATION,
      event: EVENT_CANCELLATION,
    },
    {
      type: TYPE_MEMBERSHIP,
      state: STATE_CANCELLED,
      event: EVENT_CANCEL,
    },

    // Product / Scheduled
    {
      type: TYPE_PRODUCT,
      state: STATE_UNPAID,
      event: EVENT_FAILED,
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_PAUSED,
      event: EVENT_PAUSE,
    },
    {
      type: TYPE_PRODUCT,
      state: STATE_CANCELLED,
      event: EVENT_CANCEL,
    },
  ];



  describe('valid subscription state transitions', () => {
    const testValidTransition = (type, state, event, want) => {
      test(`${type} subscription: ${state} -> ${event} should result in state ${want.state}`, () => {
        const input =
          SubscriptionWithState(
            SubscriptionWithType(generateSubscription(), type),
            state
          );
        const got = container.cradle.transitionSubscriptionStateBehaviour(input, event);

        expect(got).toEqual(expect.objectContaining(want));
      });
    }
    validTransitions.forEach(({ type, state, event, want }) => {
      testValidTransition(type, state, event, want);
      // Right now PRODUCT / SCHEDULED are the same behaviour. This is here
      // for boosting code coverage. In the future if TYPE_PRODUCT / TYPE_SCHEDULED
      // differ, remove this line and add those cases to the test array.
      if (type === TYPE_PRODUCT) {
        testValidTransition(TYPE_SCHEDULED, state, event, want);
      }
    });

    test(`activating a subscription that has a null cycle date should calculate the next cycle from getCurrentDateBehaviour`, async () => {
      const input = SubscriptionWithType(generateSubscription(), TYPE_PRODUCT);
      input.state = STATE_PAUSED;
      input.next_cycle = null;

      container.cradle.transitionSubscriptionStateBehaviour(input, EVENT_ACTIVATE);
      expect(container.cradle.getCurrentDateBehaviour).toBeCalledTimes(1);
      expect(container.cradle.calculateNextCycleBehaviour).toBeCalledWith(input.frequency_type, input.frequency_value, nextCycleDateMock);
    });

    test(`activating a subscription that previously had a null cycle date should calculate the next cycle from its previous next_cycle vlaue`, async () => {
      const input = SubscriptionWithType(generateSubscription(), TYPE_PRODUCT);
      input.state = STATE_PAUSED;
      input.next_cycle = new Date(Date.UTC(1991, 1, 1));

      container.cradle.transitionSubscriptionStateBehaviour(input, EVENT_ACTIVATE);
      expect(container.cradle.getCurrentDateBehaviour).toBeCalledTimes(0);
      expect(container.cradle.calculateNextCycleBehaviour).toBeCalledWith(input.frequency_type, input.frequency_value, input.next_cycle);
    });
  });

  describe('invalid subscription state transitions', () => {
    invalidTransitions.forEach(({ type, state, event }) => {
      const subscription = SubscriptionWithType(generateSubscription(), type);
      const input = SubscriptionWithState(subscription, state);

      test(`${type} subscription: ${state} -> ${event} should throw an InvalidStateTransition error`, async () => {
        expect(() => {
          container.cradle.transitionSubscriptionStateBehaviour(input, event)
        }).toThrow(`${state} is not allowed to transition with ${event}`);
      });
    });

    test('invalid subscription type throws an error', () => {
      const nonExistentType = 'asdfg';
      const input = SubscriptionWithType(generateSubscription(), nonExistentType);
      expect(() => {
        container.cradle.transitionSubscriptionStateBehaviour(input, EVENT_TRIAL);
      }).toThrow(`${nonExistentType} not found`);
    });
  });

  describe('idempotent state transitions', () => {
    idempotentTransitions.forEach(({ type, state, event }) => {
      test(`${type} subscription: state ${state} -> ${event} should not change anything`, () => {
        const input =
          SubscriptionWithState(
            SubscriptionWithType(generateSubscription(), type),
            state
          );

        const got = container.cradle.transitionSubscriptionStateBehaviour(input, event);
        expect(got).toEqual(input);
      })
    })
  })
});
