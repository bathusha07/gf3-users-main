import { When, Then } from '@cucumber/cucumber';
import axios, { AxiosResponse } from 'axios';
import { assert } from 'chai';

const GF3_USERS_URL = process.env.GF3_USERS_URL || 'http://localhost:8080';

interface GF3UserService {
  response: AxiosResponse;
}

When('we request the api-docs endpoint', async function (this: GF3UserService) {
  this.response = await axios.get(`${GF3_USERS_URL}/api-docs/`);
  return this.response;
});

Then('the application returns the open-api definition', function (this: GF3UserService) {
  assert.equal(this.response.status, 200);
});
