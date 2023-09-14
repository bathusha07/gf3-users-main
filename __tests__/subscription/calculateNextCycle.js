const awilix = require('awilix');
const calculateNextCycle = require('../../domain/subscription/calculateNextCycle');
const {
  DATE_UNIT_DAY,
  DATE_UNIT_MONTH,
  DATE_UNIT_YEAR,
} = require('../../domain/date/constants');

describe('calculateNextCycle', () => {
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  const utc = (year, month, day) => new Date(Date.UTC(year, month, day));
  // 1970-01-01
  const defaultTestDate = () => utc(1970, 0, 1);
  container.register({
    getCurrentDateBehaviour: awilix.asFunction(() => defaultTestDate),
    calculateNextCycleBehaviour: awilix.asFunction(calculateNextCycle),
  });
  const validTestCases = [
    {
      description: 'adding one year',
      input: [
        DATE_UNIT_YEAR,
        2,
        defaultTestDate(),
      ],
      want: utc(1972, 0, 1),
    },
    {
      description: 'adding one month',
      input: [
        DATE_UNIT_MONTH,
        1,
        defaultTestDate(),
      ],
      want: utc(1970, 1, 1),
    },
    {
      description: 'adding twelve months changes the year',
      input: [
        DATE_UNIT_MONTH,
        12,
        defaultTestDate(),
      ],
      want: utc(1971, 0, 1),
    },
    {
      description: 'adding one day',
      input: [
        DATE_UNIT_DAY,
        1,
        defaultTestDate(),
      ],
      want: utc(1970, 0, 2),
    },
  ];

  describe('valid test cases', () => {
    validTestCases.forEach(({ description, input, want }) => {
      test(description, () => {
        const got = container.cradle.calculateNextCycleBehaviour(...input);
        const ymdGot = [got.getYear(), got.getMonth(), got.getDay()];
        const ymdWant = [want.getYear(), want.getMonth(), want.getDay()];
        expect(ymdGot).toEqual(ymdWant);
      });
    });
  });

  describe('invalid test cases', () => {
    test('invalid date units should throw an error', () => {
      expect(() => {
        container.cradle.calculateNextCycleBehaviour('asdfg', 1);
      }).toThrow(TypeError);
    });
  })

})
