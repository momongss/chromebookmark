class RectDragger extends HTMLElement {
  Init($parent, anchor) {
    this.$parent = $parent;
    $parent.appendChild(this);
    this.eventListeners();

    if (anchor == null) {
      anchor = { x: 0, y: 0 };
    }
    this.anchor = anchor;
    this.hide();
  }

  start = () => {};

  isDragging = false;

  onMouseDown = (e) => {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);

    const isNode = elements.some(el => el.classList.contains("node"));
    if (isNode) {
      return;
    }

    window.isRectSelecting = true;
    this.isDragging = true;

    this.startX = e.clientX - this.anchor.x;
    this.startY = e.clientY - this.anchor.y;

    const dragBox = this;

    dragBox.style.visibility = "visible";

    dragBox.style.left = `${this.startX}px`;
    dragBox.style.top = `${this.startY}px`;

    dragBox.style.width = `${0}px`;
    dragBox.style.height = `${0}px`;

    for (const el of this.matchingElements) {
      el.firstElementChild.classList.remove("selected");
      el.classList.remove("multi");
    }
    this.matchingElements = [];
  };

  matchingElements = [];

  sortElementsByReverseDOMOrder(elements) {
    if (!elements || elements.length === 0) {
      return [];
    }

    // DOM 역순으로 정렬
    return elements.sort((a, b) => {
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING
        ? -1
        : 1;
    });
  }

  onMouseMove = (e) => {
    if (this.isDragging == false) return;

    // 드래그 상자의 크기와 위치 업데이트
    const currentX = e.clientX - this.anchor.x;
    const currentY = e.clientY - this.anchor.y;

    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);

    const dragBox = this;

    dragBox.style.width = `${width}px`;
    dragBox.style.height = `${height}px`;

    dragBox.style.left = `${Math.min(currentX, this.startX)}px`;
    dragBox.style.top = `${Math.min(currentY, this.startY)}px`;

    const allNode = Array.from(this.$parent.querySelectorAll("*")).filter(
      (el) => el.tagName.toLowerCase().includes("node")
    );

    const boxRect = dragBox.getBoundingClientRect();

    allNode.forEach((element) => {
      const elementRect = element.getBoundingClientRect();
      // 요소가 dragBox 범위 내에 있는지 확인
      if (
        elementRect.right > boxRect.left &&
        elementRect.left < boxRect.right &&
        elementRect.bottom > boxRect.top &&
        elementRect.top < boxRect.bottom
      ) {
        if (this.matchingElements.includes(element) == false) {
          this.matchingElements.push(element);
          element.firstElementChild.classList.add("selected");
          element.classList.add("multi");

          element.dragger = this;
        }
      } else {
        if (this.matchingElements.includes(element)) {
          const index = this.matchingElements.indexOf(element);
          this.matchingElements.splice(index, 1);
          element.firstElementChild.classList.remove("selected");
          element.classList.remove("multi");
        }
      }
    });
  };

  onMouseUp = (e) => {
    if (this.isDragging == false) return;
    this.isDragging = false;
    window.isRectSelecting = false;

    const dragBox = this;
    dragBox.style.left = `${this.startX}px`;
    dragBox.style.top = `${this.startY}px`;
    dragBox.style.width = `${0}px`;
    dragBox.style.height = `${0}px`;
    dragBox.style.visibility = "hidden";

    this.matchingElements = this.sortElementsByReverseDOMOrder(
      this.matchingElements
    );

    // 선택된 요소들이 있으면 임시 컨테이너 생성
    if (this.matchingElements.length > 0) {
      this.createTemporaryContainer();
    }
  };

  createTemporaryContainer = () => {
    // 임시 컨테이너 생성
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.width = '100%';
    tempContainer.style.height = '100%';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.zIndex = '9999';
    tempContainer.draggable = true;
    tempContainer.className = 'temp-drag-container';

    // 선택된 요소들을 임시 컨테이너로 이동
    this.matchingElements.forEach(element => {
      // 원래 위치 저장
      const rect = element.getBoundingClientRect();
      const parentRect = this.$parent.getBoundingClientRect();
      
      // 절대 위치로 설정
      element.style.position = 'absolute';
      element.style.left = `${rect.left - parentRect.left}px`;
      element.style.top = `${rect.top - parentRect.top}px`;
      element.style.zIndex = '10000';
      
      // 임시 컨테이너에 추가
      tempContainer.appendChild(element);
    });

    // 임시 컨테이너를 부모에 추가
    this.$parent.appendChild(tempContainer);

    // 드래그 이벤트 설정
    tempContainer.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', 'multi-drag');
      window.currentDragNodes = [...this.matchingElements];
    });

    tempContainer.addEventListener('dragend', (e) => {
      // 드래그가 끝나면 임시 컨테이너 제거하고 요소들을 원래 위치로 복원
      this.restoreElements();
    });

    // 임시 컨테이너 참조 저장
    this.tempContainer = tempContainer;
  };

  restoreElements = () => {
    if (!this.tempContainer) return;

    // 선택된 요소들을 원래 부모로 복원
    this.matchingElements.forEach(element => {
      // 절대 위치 제거
      element.style.position = '';
      element.style.left = '';
      element.style.top = '';
      element.style.zIndex = '';
      
      // 원래 부모로 복원
      this.$parent.appendChild(element);
    });

    // 임시 컨테이너 제거
    if (this.tempContainer.parentNode) {
      this.tempContainer.parentNode.removeChild(this.tempContainer);
    }
    this.tempContainer = null;
  };

  end = () => {};

  hide = () => {
    this.style.visibility = "hidden";
  };

  eventListeners = () => {
    document.addEventListener("pointerdown", this.onMouseDown);
    document.addEventListener("pointermove", this.onMouseMove);
    document.addEventListener("pointerup", this.onMouseUp);
  };
}

customElements.define("rect-dragger", RectDragger);

export default RectDragger;
