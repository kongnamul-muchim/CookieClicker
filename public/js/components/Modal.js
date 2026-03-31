import Component from './Component.js';

class Modal extends Component {
  constructor(props) {
    super(props);
    this.isOpen = false;
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'modal';
    this.element.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${this.props.title || ''}</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body"></div>
      </div>
    `;
    
    this.element.querySelector('.modal-close').addEventListener('click', () => {
      this.close();
    });
    
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });
    
    return this.element;
  }

  open() {
    if (!this.element) this.render();
    this.element.classList.add('active');
    this.isOpen = true;
    this.emit('open');
    return this;
  }

  close() {
    if (this.element) {
      this.element.classList.remove('active');
    }
    this.isOpen = false;
    this.emit('close');
    return this;
  }

  toggle() {
    return this.isOpen ? this.close() : this.open();
  }

  setContent(html) {
    const body = this.$('.modal-body');
    if (body) {
      if (typeof html === 'string') {
        body.innerHTML = html;
      } else {
        body.innerHTML = '';
        body.appendChild(html);
      }
    }
    return this;
  }
}

export default Modal;