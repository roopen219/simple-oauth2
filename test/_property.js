const has = (object, property) => Object.hasOwn(object, property);
const hasIn = (object, propertyName) => propertyName in object;

export { has, hasIn };
