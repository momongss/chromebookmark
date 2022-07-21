import FileMain from "./File/FileMain.js";
import FolderMain from "./Folder/FolderMain.js";
import OptionCreate from "./Options/OptionCreate.js";

import Bookmark from "../utils/bookmark.js";

import { folderManagerDic } from "./FolderManagerDic.js";
import { FolderManagerData } from "../utils/FolderManagerData.js";

export default class FolderManager {
  static GetFolderManager(id) {
    if (!folderManagerDic.contains(id)) {
      console.error("존재하지 않는 id", id);
    }

    return folderManagerDic[id];
  }

  constructor({ $app, id, initPos, onDestroy }) {
    this.id = id;
    this.curId = id;

    this.selectedObjs = [];
    this.initX = 0;
    this.initY = 0;

    this.isDragging = false;

    folderManagerDic[id] = this;

    this.$div = document.createElement("div");
    this.$div.className = "drag-select-box";
    document.body.appendChild(this.$div);

    const $folderWrapper = document.createElement("div");
    $folderWrapper.className = `folder-manager-wrapper`;

    FolderManagerData.zindex++;
    $folderWrapper.style.zIndex = FolderManagerData.zindex;
    FolderManagerData.$prevManager = $folderWrapper;

    $folderWrapper.addEventListener("mousedown", (e) => {
      if (FolderManagerData.$prevManager === $folderWrapper) return;
      FolderManagerData.zindex++;
      $folderWrapper.style.zIndex = FolderManagerData.zindex;
      FolderManagerData.$prevManager = $folderWrapper;
    });

    document.body.appendChild($folderWrapper);

    this.$app = $app;

    this.$folderManagerWrapper = $folderWrapper;
    this.history = [];
    this.nodeCount = 0;

    this.pos = {
      left: initPos.left < 393 ? 0 : initPos.left - 393,
      top: initPos.top,
    };

    this.onDestroy = onDestroy;

    this.render({
      id: id,
    });
  }

  rightClickHandler() {
    const $folderManager =
      this.$folderManagerWrapper.querySelector(".folder-manager");

    document.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();
    });

    $folderManager.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();
      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });
    });

    $folderManager.addEventListener("contextmenu", (e) => {
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
          mode: "manager",
        });
        this.$createOptions = optionCreate.$createOptions;
      }
    });

    $folderManager.addEventListener("mousedown", (e) => {
      if (
        e.target.className.includes("node-wrapper") ||
        e.target.className == "folder-manager"
      ) {
        this.startDragSelect(e.clientX, e.clientY);
      }
    });

    document.addEventListener("mouseup", (e) => {
      this.endDrag();
    });

    document.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        const rect = $folderManager.getBoundingClientRect();

        let x = e.clientX;
        let y = e.clientY;

        if (y < rect.top) {
          y = rect.top;
        } else if (y > rect.bottom + 18) y = rect.bottom + 18;
        if (x < rect.left) x = rect.left;
        else if (x > rect.right) x = rect.right;

        this.dragging(x, y);
      }
    });
  }

  startDragSelect(x, y) {
    this.$div.style.visibility = "visible";
    this.initX = x;
    this.initY = y;
    this.isDragging = true;

    for (let i = 0; i < this.selectedObjs.length; i++) {
      const node = this.selectedObjs[i];

      node.deselect();
    }

    this.selectedObjs = [];
  }

  endDrag() {
    this.isDragging = false;
    this.$div.style.visibility = "hidden";
    this.$div.style.left = `${window.innerWidth}px`;
    this.$div.style.right = `0px`;
    this.$div.style.top = `${window.innerHeight}px`;
    this.$div.style.bottom = `0px`;

    for (let i = 0; i < this.nodeList.length; i++) {
      const node = this.nodeList[i];

      if (node.isSelected) {
        this.selectedObjs.push(node);
      }
    }
  }

  search(sx, sy, bx, by) {
    for (let i = 0; i < this.nodeList.length; i++) {
      const node = this.nodeList[i];

      const rect = node.$node.getBoundingClientRect();
      const y = (rect.top + rect.bottom) / 2;
      const x = (rect.right + rect.left) / 2;

      if (sx <= x && x <= bx && sy <= y && y <= by) {
        node.select();
      } else {
        node.deselect();
      }
    }
  }

  dragging(x, y) {
    let sx, sy, bx, by;

    if (x > this.initX) {
      this.$div.style.left = `${this.initX}px`;
      this.$div.style.right = `${window.innerWidth - x}px`;

      sx = this.initX;
      bx = x;
    } else {
      this.$div.style.left = `${x}px`;
      this.$div.style.right = `${window.innerWidth - this.initX}px`;
      sx = x;
      bx = this.initX;
    }

    if (y > this.initY) {
      this.$div.style.top = `${this.initY}px`;
      this.$div.style.bottom = `${window.innerHeight - y}px`;

      sy = this.initY;
      by = y;
    } else {
      this.$div.style.top = `${y}px`;
      this.$div.style.bottom = `${window.innerHeight - this.initY}px`;

      sy = y;
      by = this.initY;
    }

    this.search(sx, sy, bx, by);
  }

  dragListener($header) {
    let dragged = false;
    let initX, initY;
    let folderX, folderY;

    $header.addEventListener("mousedown", (e) => {
      if (e.target.className === "folder-close") return;
      dragged = true;
      initX = e.clientX;
      initY = e.clientY;

      folderX = parseInt(
        this.$folderManagerWrapper.style.left.slice(
          0,
          this.$folderManagerWrapper.style.left.length - 2
        )
      );

      folderY = parseInt(
        this.$folderManagerWrapper.style.top.slice(
          0,
          this.$folderManagerWrapper.style.top.length - 2
        )
      );
    });

    let left;
    let top;

    document.addEventListener("mousemove", (e) => {
      if (dragged) {
        left = folderX + e.clientX - initX;
        top = folderY + e.clientY - initY;

        this.$folderManagerWrapper.style.left = `${left}px`;
        this.$folderManagerWrapper.style.top = `${top}px`;
      }
    });

    $header.addEventListener("mouseup", (e) => {
      dragged = false;

      this.pos.left = left;
      this.pos.top = top;
    });
  }

  async render({ id, mode }) {
    this.curId = id;

    const subTree = await Bookmark.getSubTree(id);
    const title = subTree[0].title;
    const bookMarkTree = subTree[0].children;
    if (mode !== "back" && mode !== "rerender") {
      this.history.push({
        id: id,
      });
    }
    this.$folderManagerWrapper.innerHTML = "";
    this.$folderManagerWrapper.classList.add("show");
    this.$folderManagerWrapper.style.top = `${this.pos.top}px`;
    this.$folderManagerWrapper.style.left = `${this.pos.left}px`;

    const $backBtn = document.createElement("div");
    $backBtn.className = "back-btn";
    $backBtn.innerHTML = `<img src="../../assets/back-arrow.svg"/>`;
    if (this.history.length > 1) {
      $backBtn.classList.add("backable");
    }
    $backBtn.addEventListener("click", (e) => {
      if (this.history.length === 1) return;
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
      this.CloseFolderManager();
    });

    const $folderManager = document.createElement("div");
    $folderManager.className = `folder-manager`;
    $folderManager.dataset.id = id;

    $folderManager.addEventListener("click", (e) => {
      const $node = e.target.parentElement;
      if ($node.classList.contains("folder")) {
        this.render({ id: $node.dataset.id });
      }
    });

    this.$folderManagerWrapper.appendChild($header);
    this.$folderManagerWrapper.appendChild($folderManager);

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

    this.nodeList = [];

    for (const bookMark of folderBookMark) {
      const folder = this.addFolder($folderManager, bookMark);
      this.nodeList.push(folder);
    }

    for (const bookMark of fileBookMark) {
      const file = this.addFile($folderManager, bookMark);
      this.nodeList.push(file);
    }

    this.rightClickHandler();
  }

  CloseFolderManager() {
    folderManagerDic[this.id] = null;

    this.$folderManagerWrapper.remove();
    this.history = [];
    this.onDestroy();
  }

  addFolder($folderManager, bookMark) {
    const folder = new FolderMain({
      $manager: $folderManager,
      bookMark,
    });

    this.nodeCount++;
    folder.$.style.zIndex = -this.nodeCount + FolderManagerData.zindex;

    return folder;
  }

  addFile($folderManager, bookMark) {
    const file = new FileMain({
      $manager: $folderManager,
      bookMark: bookMark,
    });

    this.nodeCount++;
    file.$.style.zIndex = -this.nodeCount + FolderManagerData.zindex;

    return file;
  }
}
