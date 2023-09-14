const awilix = require('awilix');
const dummyResponse = require('../../factories/dummyResponse');
const generateUser = require('../../factories/user');
const generateUserRequest = require('../../factories/userRequest');
const { User } = require('../../domain/user/data');
const uuidregex = require('uuid-regexp');

describe('createUser', () => {

  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });
  container.register({
    createUserController: awilix.asFunction(require('../../controllers/user').createUser),
    createUserBehaviour: awilix.asFunction(require('../../domain/user/createUser')),
  });

  describe('when no user with matching firebase_id exists', () => {

    beforeEach(() => {
      container.register({
        createUserRepository: awilix.asFunction(() => (user) => User(user)),
        getUserByFirebaseIdRepository: awilix.asFunction(() => () => null)
      });
    });

    test('creating a user auto generates an id', async () => {
      const req = {
        body: generateUserRequest()
      };
      const res = dummyResponse();
      await container.cradle.createUserController(req, res);
      expect(uuidregex().test(res.json.mock.calls[0][0].id)).toEqual(true);
    });

    test('creating a user with bad input results in a validation error', async () => {
      const dummyUserRequest = generateUserRequest();
      dummyUserRequest.email = 'barney@domain';
      const req = {
        body: dummyUserRequest
      };
      const next = jest.fn();
      await container.cradle.createUserController(req, {}, next);
      expect(next.mock.calls[0][0].message).toEqual('email must be a valid email');
      expect(next.mock.calls[0][0].statusCode).toEqual(400);
    });
  });

  describe('when a user with matching firebase_id exists', () => {

    const inMemoryUser = generateUser();
    beforeEach(() => {
      container.register({
        createUserRepository: awilix.asFunction(() => (userToCreate) => {
          if(userToCreate.firebase_id !== inMemoryUser.firebase_id) {
            return userToCreate;
          }
          throw Error('Duplicate uid');
        }),
        getUserByFirebaseIdRepository: awilix.asFunction(() => () => inMemoryUser)
      });
    });

    test('creating a user with data matching a current user record returns the existing user', async () => {
      const req = {
        body: (({
          firebase_id,
          email,
          first_name,
          last_name
        }) => ({
          firebase_id,
          email,
          first_name,
          last_name
        }))(inMemoryUser)
      };
      const res = dummyResponse();
      await container.cradle.createUserController(req, res);
      expect(res.json.mock.calls[0][0].id).toEqual(inMemoryUser.id);
    });

    test('creating a user with data not matching a current user record returns error', async () => {
      const req = {
        body: {
          firebase_id: inMemoryUser.firebase_id,
          email: 'barney@domain.com',
          first_name: inMemoryUser.first_name,
          last_name: inMemoryUser.last_name,
        }
      };
      await expect(async () => {
        await container.cradle.createUserController(req, {});
      }).rejects.toThrow('Duplicate uid');
    });
  });
});
