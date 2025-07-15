import bookmarkManager from "../utils/bookmark.js";
import Storage from "../utils/storage.js";

export default class ItemNode extends HTMLElement {
  bookMark = null;
  data = null;
  isDragging = false;
  isDraggingHead = false;
  parentFolderManager = null;
  originalParentId = null;

  multSelectHead = null;
  wrapper;

  constructor() {
    super();
    this.#addEventListeners();

    this.isDragging = false;
    this.isDraggingHead = false;
  }

  Init({ $parent, bookMark, folderManager }) {
    this.bookMark = bookMark;

    $parent.appendChild(this);

    this.render();
    this.eventListeners();

    if (folderManager) {
      this.eventListeners_folderManager(folderManager);
    } else {
      this.eventListeners_app();
    }
  }

  ReInit({ $parent, folderManager }) {
    $parent.appendChild(this);

    this.render();
    this.removeEventListeners();
    this.eventListeners();

    if (folderManager) {
      this.eventListeners_folderManager(folderManager);
    } else {
      this.eventListeners_app();
    }
  }

  #addEventListeners() {
    this.addEventListener("pointerdown", this.onMouseDown);
    this.addEventListener("dragstart", this.onDragStart);
    document.addEventListener("pointerup", this.onMouseUp);
  }

  removeEventListeners() {
    this.removeEventListener("pointerdown", this.onMouseDown);
    document.removeEventListener("pointerup", this.onMouseUp);
  }

  onMouseDown = (e) => {
    e.stopPropagation();
    this.draggable = true;
  }

  onDragStart = (e) => {
    window.currentDraggedElement = this;
    
    // dataTransfer에도 정보 저장
    if (this.bookMark?.id) {
      e.dataTransfer.setData("text/plain", this.bookMark.id);
    }
  }

  onMouseUp = (e) => {
    e.stopPropagation();
    this.draggable = false;
  }
}

