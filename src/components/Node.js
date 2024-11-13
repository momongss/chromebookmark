import bookmarkManager from "../utils/bookmark.js";
import Storage from "../utils/storage.js";
import App from "./App.js";

class ItemNode extends HTMLElement {
  data = null;
  isDragging = false;

  constructor() {
    super();
    this.#addEventListeners();
  }

  #addEventListeners() {
    this.addEventListener("mousedown", this.onDragStart);
    this.addEventListener("click", this.onClick);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  removeEventListeners() {
    this.removeEventListener("mousedown", this.onDragStart);
    this.removeEventListener("click", this.onClick);
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
  }

  onMouseDown = (event) => {
    console.log("hit");
  };

  #originParent = null;

  onDragStart = (event) => {
    event.preventDefault(); // 기본 드래그 동작 비활성화

    // 드래그 시작 위치에서의 오프셋 저장
    this.offsetX = event.clientX - this.getBoundingClientRect().left;
    this.offsetY = event.clientY - this.getBoundingClientRect().top;

    // 클릭을 막기 위한 드래그 시작 위치 저장
    this.startX = event.clientX;
    this.startY = event.clientY;

    this.style.position = "fixed"; // 요소 위치를 업데이트하기 위해 필요
    this.isDragging = true;

    const x = event.clientX - this.offsetX;
    const y = event.clientY - this.offsetY;

    this.style.left = `${x}px`;
    this.style.top = `${y}px`;

    this.parentElement.style.zIndex = 10000;
    this.style.zIndex = 10000;
  };

  onMouseMove = (event) => {
    if (this.isDragging) {
      console.log("move");
      // 마우스 위치에서 오프셋을 빼서 새로운 위치 계산
      const x = event.clientX - this.offsetX;
      const y = event.clientY - this.offsetY;
      this.style.left = `${x}px`;
      this.style.top = `${y}px`;
    }
  };

  dragEndTime;

  onMouseUp = (event) => {
    this.style = "";

    if (this.isDragging == false) return;
    this.isDragging = false;
    this.dragEndTime = performance.now();

    const centerX = event.clientX - this.offsetX + this.offsetWidth / 2;
    const centerY = event.clientY - this.offsetY + this.offsetHeight / 2;

    const elementsAtPoint = document.elementsFromPoint(centerX, centerY);

    const folderManager = elementsAtPoint.find(
      (element) => element.tagName == "FOLDER-MANAGER"
    );

    if (folderManager) {
      folderManager.addItem(this.bookMark);
      this.remove();
      return;
    }

    const targetWrapper = elementsAtPoint.find((element) =>
      element.className.includes("node-wrapper-")
    );

    const className = targetWrapper.className;

    const match = className.match(/node-wrapper-(\d+)-(\d+)/);
    if (match && targetWrapper.childNodes.length == 0) {
      const x = parseInt(match[1], 10); // x 값을 정수로 변환
      const y = parseInt(match[2], 10); // y 값을 정수로 변환
      bookmarkManager.moveTree(this.bookMark.id, "1");

      this.movePosition(x, y, targetWrapper);
    } else {
      console.log("node-wrapper-x-y 형식의 클래스 이름을 찾을 수 없습니다.");
    }

    this.parentElement.style.zIndex = 0;
    this.style.zIndex = 0;
  };

  onClick = (e) => {
    const now = performance.now();
    if (isNaN(this.dragEndTime)) return;

    const delay = now - this.dragEndTime;
    if (delay < 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  async movePosition(x, y, target) {
    target.appendChild(this);

    Storage.setPos(this.bookMark.id, { x: x, y: y });
  }
}

customElements.define("item-node", ItemNode);

export default ItemNode;
