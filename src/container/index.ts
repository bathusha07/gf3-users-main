import * as awilix from 'awilix';
import controller from './controller';
import domain from './domain';
import infrastructure from './infrastructure';

const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.PROXY,
});

container.register({
  ...controller,
  ...domain,
  ...infrastructure,
});

export default container;
