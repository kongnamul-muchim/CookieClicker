import EventEmitter from './EventEmitter.js';

class StateManager extends EventEmitter {
  constructor(initialState = {}) {
    super();
    this.state = initialState;
    this.previousState = null;
  }

  getState() {
    return { ...this.state };
  }

  setState(newState) {
    this.previousState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.emit('state:changed', {
      current: this.state,
      previous: this.previousState
    });
  }

  get(path) {
    const keys = path.split('.');
    let value = this.state;
    for (const key of keys) {
      if (value === undefined) return undefined;
      value = value[key];
    }
    return value;
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.state;
    
    for (const key of keys) {
      if (target[key] === undefined) target[key] = {};
      target = target[key];
    }
    
    target[lastKey] = value;
    this.emit('state:changed', { current: this.state });
  }
}

export default StateManager;