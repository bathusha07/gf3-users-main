const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateUser = require('../../factories/user');
const generateCard = require('../../factories/card');
const { Card } = require('../../domain/card/data');
const { User } = require('../../domain/user/data');

describe('getUserCards', () => {

  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    getUserCardsController: awilix.asFunction(require('../../controllers/card').getUserCards),
    getUserCardsBehaviour: awilix.asFunction(require('../../domain/card/getUserCards')),
  });

  describe('when requesting a user\'s cards', () => {
    describe('and no user by the specified ID is found', () => {
      test('an error 404 should be thrown', async () => {

        const dummyUser = generateUser();
        container.register({
          getUserRepository: awilix.asFunction(() => () => null),
          getUserCardsRepository: awilix.asFunction(() => () => [])
        });

        const req = {
          params: { id: dummyUser.id },
        };
        const next = jest.fn();
        await container.cradle.getUserCardsController(req, {}, next);
        expect(next.mock.calls[0][0].message).toEqual(`User with ID ${dummyUser.id} not found`);
        expect(next.mock.calls[0][0].statusCode).toEqual(404);
      });
    });

    describe('and a user by the specified ID is found', () => {
      const inMemoryUser = User(generateUser());

      describe('and there are no cards for that user', () => {
        test('an empty array should be returned', async () => {

          container.register({
            getUserRepository: awilix.asFunction(() => () => inMemoryUser),
            getUserCardsRepository: awilix.asFunction(() => () => [])
          });

          const req = {
            params: { id: inMemoryUser.id },
          };
          const res = dummyResponse();
          await container.cradle.getUserCardsController(req, res);
          expect(res.json.mock.calls[0][0]).toStrictEqual([]);
        });
      });

      describe('and a list of cards are found for the user', () => {
        const inMemoryCards = [
          Card(generateCard()),
          Card(generateCard())
        ];

        test('the card list should be returned in an array', async () => {

          container.register({
            getUserRepository: awilix.asFunction(() => () => inMemoryUser),
            getUserCardsRepository: awilix.asFunction(() => () => inMemoryCards)
          });

          const req = {
            params: { id: inMemoryUser.id },
          };
          const res = dummyResponse();
          await container.cradle.getUserCardsController(req, res);
          expect(res.json.mock.calls[0][0].length).toEqual(2);
          expect(res.json.mock.calls[0][0][0].id).toEqual(inMemoryCards[0].id);
          expect(res.json.mock.calls[0][0][1].id).toEqual(inMemoryCards[1].id);
        });
      });
    });
  });
});
