import TempDragger from "./tempDragger.js";

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

    // TempDragger 인스턴스 생성
    this.tempDragger = new TempDragger();
    document.body.appendChild(this.tempDragger);
  }

  start = () => {};

  isDragging = false;

  onMouseDown = (e) => {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);

    const isNode = elements.some(el => 
      el.tagName === 'FILE-NODE' || 
      el.tagName === 'FOLDER-NODE' || 
      el.tagName === 'ITEM-NODE' ||
      el.classList.contains("node")
    );
    if (isNode) {
      console.log('노드 위에서 클릭 - 드래그 박스 시작 안함');
      return;
    }

    console.log('드래그 박스 시작');
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

    const allNode = Array.from(this.$parent.querySelectorAll("file-node, folder-node, item-node"));

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
          
          console.log(`요소 선택됨: ${element.bookMark?.title || element.tagName}`);
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

    console.log(`현재 선택된 요소 수: ${this.matchingElements.length}`);
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

    // 선택된 요소들이 있으면 TempDragger에 추가
    if (this.matchingElements.length > 0) {
      console.log(`${this.matchingElements.length}개 요소가 선택됨 - TempDragger에 추가`);
      // 원래 부모 정보 저장
      this.tempDragger.saveOriginalParents(this.matchingElements);
      // 요소들을 TempDragger에 추가
      this.tempDragger.addElements(this.matchingElements);
    } else {
      console.log('선택된 요소가 없음');
    }
  };



  end = () => {};

  hide = () => {
    this.style.visibility = "hidden";
  };

  eventListeners = () => {
    this.$parent.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
    
    // 터치 이벤트도 추가 (모바일 지원)
    this.$parent.addEventListener("touchstart", this.onMouseDown);
    document.addEventListener("touchmove", this.onMouseMove);
    document.addEventListener("touchend", this.onMouseUp);
    
    console.log('RectDragger 이벤트 리스너 등록됨');
  };
}

customElements.define("rect-dragger", RectDragger);

export default RectDragger;
