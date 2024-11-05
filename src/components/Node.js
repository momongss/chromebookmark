class ItemNode extends HTMLElement {
  data = null;
  isDragging = false;

  constructor() {
    super();
    this.#addEventListeners();
  }

  #addEventListeners() {
    this.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
    this.addEventListener("click", this.onClick, true); // 캡처링 단계에서 클릭 이벤트 핸들링
  }

  removeEventListeners() {
    this.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
    this.removeEventListener("click", this.onClick, true);
  }

  onMouseDown = (event) => {
    event.preventDefault(); // 기본 드래그 동작 비활성화

    this.style.position = "absolute"; // 요소 위치를 업데이트하기 위해 필요
    this.isDragging = true;

    // 드래그 시작 위치에서의 오프셋 저장
    this.offsetX = event.clientX - this.getBoundingClientRect().left;
    this.offsetY = event.clientY - this.getBoundingClientRect().top;

    // 클릭을 막기 위한 드래그 시작 위치 저장
    this.startX = event.clientX;
    this.startY = event.clientY;
  };

  onMouseMove = (event) => {
    if (this.isDragging) {
      // 마우스 위치에서 오프셋을 빼서 새로운 위치 계산
      const x = event.clientX - this.offsetX;
      const y = event.clientY - this.offsetY;
      this.style.left = `${x}px`;
      this.style.top = `${y}px`;
    }
  };

  onMouseUp = () => {
    this.isDragging = false;
  };

  onClick = (event) => {
    // 드래그가 일정 거리 이상 발생한 경우 클릭 방지
    if (
      Math.abs(event.clientX - this.startX) > 5 ||
      Math.abs(event.clientY - this.startY) > 5
    ) {
      event.stopImmediatePropagation();
      event.preventDefault(); // 기본 드래그 동작 비활성화
    }
  };
}

customElements.define("item-node", ItemNode);

export default ItemNode;
