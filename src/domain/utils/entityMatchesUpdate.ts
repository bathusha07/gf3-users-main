const entityMatchesUpdate = <Entity, Input>(entity: Entity & Input, update: Input): boolean => {
  for (const key of Object.keys(update) as Array<keyof Input>) {
    if (entity[key] != update[key]) {
      return false;
    }
  }
  return true;
};

export default entityMatchesUpdate;
