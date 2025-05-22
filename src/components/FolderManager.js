import OptionCreate from "./Options/OptionCreate.js";

import Bookmark from "../utils/bookmark.js";

import { FolderManagerData } from "../utils/FolderManagerData.js";
import App from "./App.js";
import bookmarkManager from "../utils/bookmark.js";

export default class FolderManager extends HTMLElement {
  Init({ id, initPos, onDestroy }) {
    this.className = `folder-manager-wrapper`;

    FolderManagerData.zindex++;
    this.style.zIndex = FolderManagerData.zindex;
    FolderManagerData.$prevManager = this;

    this.addEventListener("mousedown", (e) => {
      if (FolderManagerData.$prevManager === this) return;
      FolderManagerData.zindex++;
      this.style.zIndex = FolderManagerData.zindex;
      FolderManagerData.$prevManager = this;
    });

    document.body.appendChild(this);

    this.$app = App.$dom;

    this.history = [];
    this.nodeCount = 0;

    this.pos = {
      left: initPos.left < 393 ? 0 : initPos.left - 393,
      top: initPos.top,
    };

    this.onDestroy = onDestroy;

    this.id = id;

    this.render({
      id: id,
    });
  }

  addItem(node) {
    // 북마크 이동을 먼저 수행
    bookmarkManager.moveTree(node.id, this.id);
    
    // 현재 드래그 중인 요소가 있는지 확인
    const draggingElement = document.querySelector('.node[style*="position: fixed"]');
    if (draggingElement) {
      // 드래그가 완료될 때까지 render 지연
      requestAnimationFrame(() => {
        this.render({ id: this.id, mode: "back" });
      });
    } else {
      // 일반적인 경우 즉시 처리
      this.render({ id: this.id, mode: "back" });
    }
  }

  rightClickHandler() {
    document.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();
    });

    this.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    this.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();
      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });
    });

    this.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });

      if (e.target.className === "folder-manager") {
        const optionCreate = new OptionCreate({
          $app: this.$app,
          $target: e.target,
          x: e.clientX,
          y: e.clientY,
        });
        this.$createOptions = optionCreate.$createOptions;
      }
    });
  }

  dragListener($header) {
    let dragged = false;
    let initX, initY;
    let folderX, folderY;

    $header.addEventListener("pointerdown", (e) => {
      if (e.target.className === "folder-close") return;
      dragged = true;
      initX = e.clientX;
      initY = e.clientY;

      folderX = parseInt(this.style.left.slice(0, this.style.left.length - 2));

      folderY = parseInt(this.style.top.slice(0, this.style.top.length - 2));
    });

    let left;
    let top;

    document.addEventListener("pointermove", (e) => {
      if (dragged) {
        left = folderX + e.clientX - initX;
        top = folderY + e.clientY - initY;

        this.style.left = `${left}px`;
        this.style.top = `${top}px`;
      }
    });

    $header.addEventListener("pointerup", (e) => {
      dragged = false;

      this.pos.left = left;
      this.pos.top = top;

      console.log(this.dragger);
      this.dragger.Init(this.$folderManager, {
        x: this.pos.left + 2,
        y: this.pos.top + 37,
      });
    });
  }

  async render({ id, mode }) {
    this.id = id;
    const subTree = await Bookmark.getSubTree(id);
    const title = subTree[0].title;
    const bookMarkTree = subTree[0].children;
    if (mode !== "back") {
      this.history.push({
        id: id,
      });
    }
    this.innerHTML = "";
    this.classList.add("show");
    this.style.top = `${this.pos.top}px`;
    this.style.left = `${this.pos.left}px`;

    const $backBtn = document.createElement("div");
    $backBtn.className = "back-btn";
    $backBtn.innerHTML = `<img src="../../assets/back-arrow.svg"/>`;
    if (this.history.length > 1) {
      $backBtn.classList.add("backable");
    }
    $backBtn.addEventListener("click", (e) => {
      console.log(this.history.length);
      if (this.history.length === 1) {
        console.error("history");
      }
      this.history.pop();
      const preFolder = this.history[this.history.length - 1];
      this.render({
        id: preFolder.id,
        mode: "back",
      });
    });

    const $header = document.createElement("div");
    $header.className = "folder-manager-header";
    $header.innerHTML = `
      <div class="folder-title">${title}</div>
      <div class="folder-close">x</div>
    `;

    $header.prepend($backBtn);

    this.dragListener($header);

    const $closeBtn = $header.querySelector(".folder-close");
    $closeBtn.addEventListener("click", (e) => {
      this.remove();
      this.history = [];
      this.onDestroy();
    });

    const $folderManager = document.createElement("div");
    this.$folderManager = $folderManager;
    $folderManager.className = `folder-manager`;
    $folderManager.dataset.id = this.id;

    this.dragger = document.createElement("rect-dragger");
    $folderManager.appendChild(this.dragger);
    this.dragger.Init($folderManager, {
      x: this.pos.left + 2,
      y: this.pos.top + 37,
    });

    this.appendChild($header);
    this.appendChild($folderManager);

    const folderBookMark = [];
    const fileBookMark = [];

    for (const bookMark of bookMarkTree) {
      if (bookMark.children != null) {
        folderBookMark.push(bookMark);
      } else {
        fileBookMark.push(bookMark);
      }
    }

    const HEIGHT = 5;
    let ROW = Math.max(parseInt(bookMarkTree.length / HEIGHT) + 2, 5);

    $folderManager.style.gridTemplateRows = `5rem `.repeat(ROW).trim();

    folderBookMark.sort((a, b) => {
      return b.dateGroupModified - a.dateGroupModified;
    });

    fileBookMark.sort((a, b) => {
      return b.dateAdded - a.dateAdded;
    });

    for (const bookMark of folderBookMark) {
      this.addFolder($folderManager, bookMark);
    }

    for (const bookMark of fileBookMark) {
      this.addFile($folderManager, bookMark);
    }

    this.rightClickHandler();
  }

  addFolder($folderManager, bookMark) {
    const folderNode = document.createElement("folder-node");
    folderNode.Init({
      $parent: $folderManager,
      bookMark: bookMark,
      isRoot: false,
      folderManager: this,
    });
    folderNode.parentFolderManager = this;

    this.nodeCount++;
  }

  addFile($folderManager, bookMark) {
    const fileNode = document.createElement("file-node");
    fileNode.Init_Manage({
      $parent: $folderManager,
      bookMark: bookMark,
    });
    fileNode.parentFolderManager = this;

    this.nodeCount++;
  }
}

customElements.define("folder-manager", FolderManager);
