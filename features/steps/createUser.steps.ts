import { Given, When, Then } from '@cucumber/cucumber';
import axios, { AxiosResponse } from 'axios';
import { assert } from 'chai';
import faker from 'faker';
import { validate as uuidValidate } from 'uuid';
import { UserEntity } from '@makegoodfood/gf3-types';

const GF3_USERS_URL = process.env.GF3_USERS_URL || 'http://localhost:8080';

interface CreateUserWorld {
  response: AxiosResponse<UserEntity>;
  dummyUser: {
    email: string;
    firebase_id: string;
    fsa: string;
    language: string;
  };
}

Given('valid user data', function (this: CreateUserWorld) {
  this.dummyUser = {
    email: faker.internet.email(),
    firebase_id: faker.random.alphaNumeric(28),
    fsa: 'L6S',
    language: 'en',
  };
});

When('we make a request to create a user', async function (this: CreateUserWorld) {
  this.response = await axios.post<UserEntity>(`${GF3_USERS_URL}/user`, this.dummyUser);
  return this.response;
});

Then('a user should be created', function (this: CreateUserWorld) {
  const responseData = this.response.data;
  assert.equal(this.response.status, 201);
  assert.equal(responseData.email, this.dummyUser.email);
  assert.equal(responseData.firebase_id, this.dummyUser.firebase_id);
  assert.equal(responseData.language, this.dummyUser.language);
  assert.isTrue(uuidValidate(responseData.id));
});
