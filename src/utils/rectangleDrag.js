class RectDragger extends HTMLElement {
  Init($parent, anchor) {
    this.$parent = $parent;
    $parent.appendChild(this);
    this.hide();
    this.eventListeners();

    if (anchor == null) {
      anchor = { x: 0, y: 0 };
    }
    this.anchor = anchor;
  }

  start = () => {};

  isDragging = false;

  onMouseDown = (e) => {
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

    console.log(this.matchingElements.length);
  };

  onMouseUp = (e) => {
    if (this.isDragging == false) return;
    this.isDragging = false;

    const dragBox = this;

    dragBox.style.left = `${this.startX}px`;
    dragBox.style.top = `${this.startY}px`;

    dragBox.style.width = `${0}px`;
    dragBox.style.height = `${0}px`;

    dragBox.style.visibility = "hidden";
  };

  end = () => {};

  hide = () => {
    this.style.visibility = false;
  };

  eventListeners = () => {
    this.$parent.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  };
}

customElements.define("rect-dragger", RectDragger);

export default RectDragger;
