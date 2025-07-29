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

    this.draggable = true;
  }

  ReInit({ $parent, folderManager }) {
    $parent.appendChild(this);

    this.render();
    this.removeEventListeners();
    this.eventListeners();

    if (folderManager) {
      this.eventListeners_folderManager(folderManager);
    } else {
      const split = $parent.className.split("-");
      const x = parseInt(split[2], 10);
      const y = parseInt(split[3], 10);
      Storage.setPos(this.bookMark.id, { x, y });
      bookmarkManager.moveTree(this.bookMark.id, "1");
      this.eventListeners_app();
    }
  }

  #addEventListeners() {
    this.addEventListener("dragstart", this.onDragStart);
  }

  removeEventListeners() {

  }

  onDragStart = (e) => {
    window.currentDraggedElement = this;
    
    // dataTransfer에도 정보 저장
    if (this.bookMark?.id) {
      e.dataTransfer.setData("text/plain", this.bookMark.id);
    }
  }
}

