export default class ItemNode extends HTMLElement {
  data = null;
  isDragging = false;
  offsetX = 0;
  offsetY = 0;

  constructor() {
    super(); // 부모 클래스의 생성자 호출

    // Shadow DOM이 필요하면 주석을 해제하세요.
    // this.attachShadow({ mode: 'open' });

    this.style.position = "absolute";
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  render() {
    this.innerHTML = `
      <div style="cursor: move;">
        Node Component
      </div>
    `;
  }

  addEventListeners() {
    this.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  removeEventListeners() {
    this.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
  }

  onMouseDown = (event) => {
    this.isDragging = true;
    this.offsetX = event.clientX - this.getBoundingClientRect().left;
    this.offsetY = event.clientY - this.getBoundingClientRect().top;
  };

  onMouseMove = (event) => {
    if (this.isDragging) {
      const x = event.clientX - this.offsetX;
      const y = event.clientY - this.offsetY;
      this.style.left = `${x}px`;
      this.style.top = `${y}px`;
    }
  };

  onMouseUp = () => {
    this.isDragging = false;
  };
}
