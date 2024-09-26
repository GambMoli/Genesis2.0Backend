export default class Command {
  execute() {
    throw new Error('El método execute() debe ser implementado en las clases derivadas');
  }

  undo() {
    throw new Error('El método undo() debe ser implementado en las clases derivadas');
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