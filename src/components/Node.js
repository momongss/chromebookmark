import bookmarkManager from "../utils/bookmark.js";
import Storage from "../utils/storage.js";
import App from "./App.js";

class ItemNode extends HTMLElement {
  bookMark = null;
  data = null;
  isDragging = false;

  constructor() {
    super();
    this.#addEventListeners();
  }

  #addEventListeners() {
    this.addEventListener("mousedown", this.onMouseDown);
    this.addEventListener("dragstart", this.onDragStart);
    this.addEventListener("click", this.onClick);
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  removeEventListeners() {
    this.removeEventListener("mousedown", this.onMouseDown);
    this.removeEventListener("dragstart", this.onDragStart);
    this.removeEventListener("click", this.onClick);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
  }

  dragStartPos = {
    x: 0,
    y: 0,
  };

  dragEndPos = {
    x: 0,
    y: 0,
  };

  onMouseDown = (e) => {
    e.preventDefault(); // 기본 드래그 동작 비활성화
    e.stopPropagation();

    if (this.classList.contains("multi")) {
      this.dragger.matchingElements.forEach((element) => {
        element.onDragStart(e);
      });
    } else {
      this.onDragStart(e);
    }
  };

  onDragStart = (e) => {
    // 드래그 시작 위치에서의 오프셋 저장
    this.offsetX = e.clientX - this.getBoundingClientRect().left;
    this.offsetY = e.clientY - this.getBoundingClientRect().top;

    // 클릭을 막기 위한 드래그 시작 위치 저장
    this.startX = e.clientX;
    this.startY = e.clientY;

    this.style.position = "fixed"; // 요소 위치를 업데이트하기 위해 필요
    this.isDragging = true;

    const x = e.clientX - this.offsetX;
    const y = e.clientY - this.offsetY;

    this.style.left = `${x}px`;
    this.style.top = `${y}px`;

    this.dragStartPos.x = x;
    this.dragStartPos.y = y;

    this.parentElement.style.zIndex = 10000;
    this.style.zIndex = 10000;
  };

  onMouseMove = (e) => {
    if (this.isDragging) {
      // 마우스 위치에서 오프셋을 빼서 새로운 위치 계산
      const x = e.clientX - this.offsetX;
      const y = e.clientY - this.offsetY;
      this.style.left = `${x}px`;
      this.style.top = `${y}px`;

      const eventX = e.clientX;
      const eventY = e.clientY;

      const left = parseInt(this.style.left);
      const top = parseInt(this.style.top);

      // 요소의 크기를 가져오기 위해 getBoundingClientRect 사용
      const rect = this.getBoundingClientRect();

      // 중심 좌표 계산
      const centerX = left + rect.width / 2;
      const centerY = top + rect.height / 2;

      const eventPosElements = document.elementsFromPoint(centerX, centerY);

      if (this.wrapper != null) {
        this.wrapper.classList.remove("hover");
      }

      this.wrapper = eventPosElements.find((element) => {
        return element.className.includes("node-wrapper");
      });

      this.wrapper.classList.add("hover");
    }
  };

  wrapper;

  calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  onMouseUp = (e) => {
    if (this.isDragging == false) return;
    this.isDragging = false;
    if (this.wrapper != null) {
      this.wrapper.classList.remove("hover");
    }

    const eventX = e.clientX;
    const eventY = e.clientY;

    const eventPosElements = document.elementsFromPoint(eventX, eventY);
    const folderNodeAtEvent = eventPosElements.find((element) =>
      element.tagName.includes("FOLDER-NODE")
    );

    if (folderNodeAtEvent && folderNodeAtEvent != this) {
      folderNodeAtEvent.addItem(this.bookMark);
      this.remove();
      return;
    }

    const folderManagerAtEvent = eventPosElements.find(
      (element) => element.tagName == "FOLDER-MANAGER"
    );

    if (folderManagerAtEvent) {
      folderManagerAtEvent.addItem(this.bookMark);
      this.remove();
      return;
    }

    // 요소의 style.left 및 style.top 값을 숫자로 변환
    const left = parseInt(this.style.left);
    const top = parseInt(this.style.top);

    // 요소의 크기를 가져오기 위해 getBoundingClientRect 사용
    const rect = this.getBoundingClientRect();

    // 중심 좌표 계산
    const centerX = left + rect.width / 2;
    const centerY = top + rect.height / 2;

    const elementsAtPoint = document.elementsFromPoint(centerX, centerY);

    const folderNode = elementsAtPoint.find((element) =>
      element.tagName.includes("FOLDER-NODE")
    );

    if (folderNode && folderNode != this) {
      folderNode.addItem(this.bookMark);
      console.log(centerX, centerY, folderNode);
      this.remove();
      return;
    }

    const targetWrapper = elementsAtPoint.find((element) =>
      element.className.includes("node-wrapper-")
    );

    const className = targetWrapper.className;

    const match = className.match(/node-wrapper-(\d+)-(\d+)/);
    const x = parseInt(match[1], 10); // x 값을 정수로 변환
    const y = parseInt(match[2], 10); // y 값을 정수로 변환

    if (this.isEmpty(match, targetWrapper)) {
      if (this.bookMark.parentId != "1") {
        bookmarkManager.moveTree(this.bookMark.id, "1");
      }

      this.movePosition(x, y, targetWrapper);
    } else {
      console.log("node-wrapper-x-y 형식의 클래스 이름을 찾을 수 없습니다.");
    }

    this.style = "";

    this.parentElement.style.zIndex = 0;
    this.style.zIndex = 0;
  };

  isEmpty = (match, targetWrapper) => {
    if (match && targetWrapper.childNodes.length == 0) {
      return true;
    }

    if (targetWrapper.childNodes[0].isDragging) {
      return true;
    }

    return false;
  };

  onClick = (event) => {
    this.dragEndPos.x = event.clientX - this.offsetX;
    this.dragEndPos.y = event.clientY - this.offsetY;

    const distance = this.calculateDistance(this.dragStartPos, this.dragEndPos);
    if (distance > 10) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  async movePosition(x, y, target) {
    target.appendChild(this);

    Storage.setPos(this.bookMark.id, { x: x, y: y });
  }
}

customElements.define("item-node", ItemNode);

export default ItemNode;
