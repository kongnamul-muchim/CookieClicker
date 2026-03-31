import Component from './Component.js';

class Toast extends Component {
  constructor(props) {
    super(props);
    this.duration = props.duration || 3000;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = `toast ${this.props.type || 'info'}`;
    this.element.textContent = this.props.message;
    
    document.getElementById('toast-container').appendChild(this.element);
    
    setTimeout(() => {
      this.unmount();
    }, this.duration);
    
    return this.element;
  }

  static show(message, type = 'info', duration = 3000) {
    new Toast({ message, type, duration }).render();
  }

  static success(message) {
    Toast.show(message, 'success');
  }

  static error(message) {
    Toast.show(message, 'error');
  }

  static warning(message) {
    Toast.show(message, 'warning');
  }

  static info(message) {
    Toast.show(message, 'info');
  }
}

export default Toast;