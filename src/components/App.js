import FileApp from "./File/FileApp.js";
import FolderApp from "./Folder/FolderApp.js";
import Wallpaper from "./Wallpaper/Wallpaper.js";

import OptionCreate from "./Options/OptionCreate.js";

import Storage from "../utils/storage.js";
import DragSelect from "../utils/dragSelect.js";

import { dropHandler } from "../utils/drop.js";
import { constDatas } from "../utils/const.js";

export default class App {
  constructor({ $app }) {
    this._constructor($app);
  }

  async _constructor($app) {
    // https://wallpaperaccess.com/aesthetic-gif

    this.selectedObjs = [];
    this.initX = 0;
    this.initY = 0;

    this.isDragging = false;

    this.$div = document.createElement("div");
    this.$div.className = "drag-select-box";
    document.body.appendChild(this.$div);

    const rootTree = await this.getBookMarkList();
    const bookMarkTree = rootTree.children;
    this.rootId = rootTree.id;
    constDatas.rootId = this.rootId;

    this.history = [];

    this.$app = $app;
    this.$wallpaper = new Wallpaper();

    const state = await Storage.getState();

    state
      ? this.renderRunned(bookMarkTree, $app)
      : this.renderMainInit(bookMarkTree, $app);

    this.eventListeners();

    // this.dragSelect = new DragSelect();
  }

  async renderRunned(bookMarkTree, $app) {
    const lenX = 20;
    const lenY = 9;

    const posUndefineds = [];

    let zIndex = 1000;
    for (let y = 0; y < lenY; y++) {
      for (let x = 0; x < lenX; x++) {
        const $div = document.createElement("div");
        $div.className = `node-wrapper-${x}-${y}`;
        $div.style.zIndex = zIndex;
        $app.appendChild($div);
        zIndex -= 1;
      }
    }

    this.nodeList = [];

    for (const bookMark of bookMarkTree) {
      if (bookMark.children == null) {
        const filePos = await Storage.getPos(bookMark.id);
        if (
          filePos == null ||
          (filePos.constructor === Object && Object.keys(filePos).length === 0)
        ) {
          posUndefineds.push(bookMark);
          continue;
        }
        const node = new FileApp({
          $manager: $app,
          bookMark: bookMark,
          pos: filePos,
        });

        this.nodeList.push(node);
      } else {
        const folderPos = await Storage.getPos(bookMark.id);
        if (folderPos == null) {
          posUndefineds.push(bookMark);
          continue;
        }

        const node = new FolderApp({
          $app: $app,
          pos: folderPos,
          bookMark: bookMark,
        });

        this.nodeList.push(node);
      }
    }

    for (const bookMark of posUndefineds) {
      if (bookMark.children == null) {
        const $wrapper = findEmpty($app);
        const tmp = $wrapper.className.split("-");
        const pos = {
          x: tmp[2],
          y: tmp[3],
        };
        const node = new FileApp({
          $manager: $app,
          bookMark: bookMark,
          pos: pos,
        });

        Storage.setPos(bookMark.id, pos);
      } else {
        const $wrapper = findEmpty($app);
        const tmp = $wrapper.className.split("-");
        const pos = {
          x: tmp[2],
          y: tmp[3],
        };
        const node = new FolderApp({
          $app: $app,
          pos: pos,
          bookMark: bookMark,
        });
        Storage.setPos(bookMark.id, pos);
      }
    }
  }

  eventListeners() {
    let $dragged;

    document.addEventListener("click", async (e) => {
      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });
    });

    this.$app.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();

      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });

      if (e.target.className.includes("node-wrapper")) {
        const optionCreate = new OptionCreate({
          $app: this.$app,
          $target: e.target,
          x: e.clientX,
          y: e.clientY,
          mode: "app",
        });
        this.$createOptions = optionCreate.$createOptions;
      }
    });

    document.addEventListener("dragstart", (e) => {
      $dragged = e.target;
      $dragged.style.opacity = 0.5;
    });

    document.addEventListener("dragend", (e) => {
      e.target.style.opacity = "";
    });

    document.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    document.addEventListener("dragenter", (e) => {
      // 이미 북마크가 존재하는 곳으로 옮겨짐 방지.
      if (e.target.parentElement.className === "file-wrapper") {
        e.preventDefault();
        return;
      }
      if (e.target.className.includes("node-wrapper")) {
        if (e.target.childElementCount > 0) {
          e.preventDefault();
          return;
        }
      }
      e.target.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    });

    document.addEventListener("dragleave", (e) => {
      e.target.style.backgroundColor = "";
    });

    document.addEventListener("drop", async (e) => {
      e.preventDefault();

      dropHandler($dragged, e.target, this.rootId);
      e.target.style.backgroundColor = "";
    });

    this.$app.addEventListener("mousedown", (e) => {
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
        this.dragging(e.clientX, e.clientY);
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

  renderMainInit(bookMarkTree, $app) {
    const lenX = 20;
    const lenY = 9;

    let zIndex = 1000;
    for (let y = 0; y < lenY; y++) {
      for (let x = 0; x < lenX; x++) {
        const $div = document.createElement("div");
        $div.className = `node-wrapper-${x}-${y}`;
        $div.style.zIndex = zIndex;
        $app.appendChild($div);
        zIndex -= 1;
      }
    }

    const fileInitX = 9;
    const fileEndX = 15;
    const folderInitX = 4;
    const folderEndX = 8;

    const filePos = { x: fileInitX, y: 1 };
    const folderPos = { x: folderInitX, y: 1 };

    let fileCnt = 0;
    let folderCnt = 0;
    for (const bookMark of bookMarkTree) {
      if (bookMark.children == null) fileCnt++;
      else folderCnt++;
    }

    this.nodeList = [];

    for (const bookMark of bookMarkTree) {
      // children 이 null 이면 파일(북마크).
      if (bookMark.children == null) {
        // 정리된 형태로 들어갈 자리가 없으면 빈자리 아무데나 들어간다.
        if (filePos.y >= lenY) {
          const $wrapper = findEmpty($app);
          const tmp = $wrapper.className.split("-");
          filePos.x = parseInt(tmp[2]);
          filePos.y = parseInt(tmp[3]);
        }
        Storage.setPos(bookMark.id, filePos);
        const node = new FileApp({
          $manager: $app,
          bookMark: bookMark,
          pos: filePos,
        });

        this.nodeList.push(node);

        filePos.x++;
        if (filePos.x >= fileEndX) {
          filePos.x = fileInitX;
          filePos.y++;
        }
      }

      // children 이 있으면 폴더.
      else {
        if (folderPos.y >= lenY) {
          const $wrapper = findEmpty($app);
          const tmp = $wrapper.className.split("-");
          folderPos.x = parseInt(tmp[2]);
          folderPos.y = parseInt(tmp[3]);
        }
        Storage.setPos(bookMark.id, folderPos);
        const node = new FolderApp({
          $app: $app,
          pos: folderPos,
          bookMark: bookMark,
        });

        this.nodeList.push(node);

        folderPos.x++;
        if (folderPos.x >= folderEndX) {
          folderPos.x = folderInitX;
          folderPos.y++;
        }
      }
    }

    Storage.setState("runned");
  }

  getBookMarkList() {
    const bookMark = new Promise((resolve) => {
      chrome.bookmarks.getTree(resolve);
    });

    return bookMark.then((itemTree) => {
      return itemTree[0].children[0];
    });
  }
}

function findEmpty($app) {
  for (const $child of $app.childNodes) {
    if (
      $child.className.includes("node-wrapper") &&
      $child.childElementCount === 0
    ) {
      return $child;
    }
  }
}
