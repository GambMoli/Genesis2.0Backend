export default class Command {
  execute() {
    throw new Error('El método execute() debe ser implementado en las clases que deriven');
  }

  getName() {
    return this.constructor.name;
  }

  getDetails() {
    return {};
  }

  byId() {
    return {}
  }
}