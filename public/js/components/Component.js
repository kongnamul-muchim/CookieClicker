import EventEmitter from '../core/EventEmitter.js';

class Component extends EventEmitter {
  constructor(props = {}) {
    super();
    this.props = props;
    this.element = null;
    this.children = [];
  }

  render() {
    return this.element;
  }

  mount(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    if (!container) return this;
    
    const el = this.render();
    if (el) {
      container.appendChild(el);
    }
    return this;
  }

  unmount() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.children.forEach(child => child.unmount());
    this.children = [];
    return this;
  }

  update(newProps) {
    this.props = { ...this.props, ...newProps };
    this._patch();
    return this;
  }

  _patch() {}

  $(selector) {
    return this.element?.querySelector(selector);
  }

  $$(selector) {
    return this.element?.querySelectorAll(selector) || [];
  }
}

export default Component;