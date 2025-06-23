import bookmarkManager from "../utils/bookmark.js";
import Storage from "../utils/storage.js";

class ItemNode extends HTMLElement {
  bookMark = null;
  data = null;
  isDragging = false;
  parentFolderManager = null;
  originalParentId = null;

  constructor() {
    super();
    this.#addEventListeners();
  }

  #addEventListeners() {
    this.addEventListener("pointerdown", this.onMouseDown);
    this.addEventListener("dragstart", this.onDragStart);
    this.addEventListener("click", this.onClick);
    document.addEventListener("pointermove", this.onMouseMove);
    document.addEventListener("pointerup", this.onMouseUp);
  }

  removeEventListeners() {
    this.removeEventListener("pointerdown", this.onMouseDown);
    this.removeEventListener("dragstart", this.onDragStart);
    this.removeEventListener("click", this.onClick);
    document.removeEventListener("pointermove", this.onMouseMove);
    document.removeEventListener("pointerup", this.onMouseUp);
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
    e.preventDefault();
    e.stopPropagation();

    // 드래그 시작 위치 저장
    this.dragStartPos.x = e.clientX;
    this.dragStartPos.y = e.clientY;

    if (this.classList.contains("multi")) {
      // 여러개 선택된 경우 현재 선택된 노드들을 전역에 저장
      if (this.dragger && this.dragger.matchingElements) {
        window.currentDragNodes = [...this.dragger.matchingElements];
      } else {
        window.currentDragNodes = [this];
      }
      this.dragger.matchingElements.forEach((element) => {
        element.onDragStart(e);
      });
    } else {
      window.currentDragNodes = [this];
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

    this.style.position = "fixed";
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
    e.preventDefault();
    e.stopPropagation();
    
    if (this.isDragging == false) return;

    // 드래그 종료 위치 저장
    this.dragEndPos.x = e.clientX;
    this.dragEndPos.y = e.clientY;

    // 드래그 거리 계산 (시작 위치와 종료 위치의 차이)
    const distance = this.calculateDistance(
      { x: this.dragStartPos.x, y: this.dragStartPos.y },
      { x: this.dragEndPos.x, y: this.dragEndPos.y }
    );

    // 드래그 거리가 5px 미만이면 클릭으로 처리
    if (distance < 5) {
      this.isDragging = false;
      if (this.wrapper != null) {
        this.wrapper.classList.remove("hover");
      }
      this.style = "";
      this.parentElement.style.zIndex = 0;
      this.style.zIndex = 0;
      window.currentDragNodes = undefined;
      return;
    }

    this.isDragging = false;
    if (this.wrapper != null) {
      this.wrapper.classList.remove("hover");
    }

    const eventX = e.clientX;
    const eventY = e.clientY;

    const eventPosElements = document.elementsFromPoint(eventX, eventY);

    // 여러개 선택된 상태에서 폴더로 드롭할 때 예외 처리
    if (
      this.classList.contains("multi") &&
      window.currentDragNodes &&
      window.currentDragNodes.length > 1 &&
      (
        window.currentDragNodes.some(node => node.classList.contains('folder')) ||
        this.classList.contains('folder')
      )
    ) {
      this.style = "";
      this.parentElement.style.zIndex = 0;
      this.style.zIndex = 0;
      window.currentDragNodes = undefined;
      return;
    }

    // 기존 단일 드래그 로직
    for (const element of eventPosElements) {
      // 폴더 노드를 찾은 경우
      if (element.tagName.includes("FOLDER-NODE") && element !== this) {
        // 폴더를 드래그하는 경우
        if (this.classList.contains("folder")) {
          // 폴더를 다른 폴더로 이동
          element.addItem(this.bookMark);
          this.remove();
          this.style = "";
          this.parentElement.style.zIndex = 0;
          this.style.zIndex = 0;
          window.currentDragNodes = undefined;
          return;
        }
        // 북마크를 드래그하는 경우
        element.addItem(this.bookMark);
        this.remove();
        window.currentDragNodes = undefined;
        return;
      }
      
      if (element.tagName === "FOLDER-MANAGER") {
        // 같은 폴더 매니저로 드롭한 경우 아무 동작도 하지 않음
        if (element === this.parentFolderManager || 
            (this.bookMark.parentId === "1" && element.id === this.originalParentId)) {
          this.style = "";
          this.parentElement.style.zIndex = 0;
          this.style.zIndex = 0;
          window.currentDragNodes = undefined;
          return;
        }
        // 다른 폴더 매니저로 이동
        element.addItem(this.bookMark);
        this.remove();
        window.currentDragNodes = undefined;
        return;
      }
    }

    // 빈 공간으로 이동
    this.handleEmptySpaceDrop(e);
    window.currentDragNodes = undefined;
  };

  handleEmptySpaceDrop = (e) => {
    const left = parseInt(this.style.left);
    const top = parseInt(this.style.top);
    const rect = this.getBoundingClientRect();
    const centerX = left + rect.width / 2;
    const centerY = top + rect.height / 2;

    const elementsAtPoint = document.elementsFromPoint(centerX, centerY);
    const targetWrapper = elementsAtPoint.find((element) =>
      element.className.includes("node-wrapper-")
    );

    if (!targetWrapper) return;

    const className = targetWrapper.className;
    const match = className.match(/node-wrapper-(\d+)-(\d+)/);
    
    if (!match) {
      console.log("node-wrapper-x-y 형식의 클래스 이름을 찾을 수 없습니다.");
      return;
    }

    const x = parseInt(match[1], 10);
    const y = parseInt(match[2], 10);

    if (this.isEmpty(match, targetWrapper)) {
      if (this.bookMark.parentId != "1") {
        // 원래 부모 ID 저장
        this.originalParentId = this.bookMark.parentId;
        bookmarkManager.moveTree(this.bookMark.id, "1");
        // 루트로 이동했으므로 parentFolderManager 초기화
        this.parentFolderManager = null;
      }
      this.movePosition(x, y, targetWrapper);
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
    console.log('북마크 클릭됨, id:', this.bookMark?.id);
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

