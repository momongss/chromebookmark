import FileApp from "./File/FileApp.js";
import FolderApp from "./Folder/FolderApp.js";

import OptionCreate from "./Options/OptionCreate.js";

import Storage from "../utils/storage.js";

import { dropHandler } from "../utils/drop.js";
import { constDatas } from "../utils/const.js";

export default class App {
  constructor({ $app }) {
    this._constructor($app);
  }

  async _constructor($app) {
    // https://wallpaperaccess.com/aesthetic-gif
    document.body.style.backgroundSize = `${window.screen.availWidth}px ${window.screen.availHeight}px`;
    document.body.style.backgroundImage = `url("chrome-extension://${chrome.runtime.id}/assets/house.png")`;
    const rootTree = await this.getBookMarkList();
    const bookMarkTree = rootTree.children;
    this.rootId = rootTree.id;
    constDatas.rootId = this.rootId;

    this.history = [];

    this.$app = $app;

    const state = await Storage.getState();

    if (state == null) {
      this.renderMainInit(bookMarkTree, $app);
    } else {
      this.renderRunned(bookMarkTree, $app);
    }
    this.eventListeners();
  }

  async renderRunned(bookMarkTree, $app) {
    const lenX = 20;
    const lenY = 9;

    const posUndefineds = [];

    for (let y = 0; y < lenY; y++) {
      for (let x = 0; x < lenX; x++) {
        const $div = document.createElement("div");
        $div.className = `node-wrapper-${x}-${y}`;
        $app.appendChild($div);
      }
    }

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
        new FileApp({
          $manager: $app,
          bookMark: bookMark,
          pos: filePos,
        });
      } else {
        const folderPos = await Storage.getPos(bookMark.id);
        if (folderPos == null) {
          posUndefineds.push(bookMark);
          continue;
        }

        new FolderApp({
          $app: $app,
          pos: folderPos,
          bookMark: bookMark,
        });
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
        new FileApp({
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
        const folder = new FolderApp({
          $app: $app,
          pos: pos,
          bookMark: bookMark,
        });
        Storage.setPos(bookMark.id, pos);
        // folder.render(bookMark, pos.x, pos.y);
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

    document.addEventListener("drag", (e) => {});

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
      if (e.target.className === "drag-area") {
        e.preventDefault();
        return;
      }
      if (e.target.className.includes("node-wrapper")) {
        if (e.target.childElementCount > 0) {
          e.preventDefault();
          return;
        }
        e.target.style.background = "rgba(0, 0, 0, 0.4)";
      }
    });

    document.addEventListener("dragleave", (e) => {
      if (e.target.className.includes("node-wrapper")) {
        e.target.style.background = "";
      }
    });

    document.addEventListener("drop", async (e) => {
      e.preventDefault();

      dropHandler($dragged, e.target, this.rootId);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "=") {
        console.log("데이터 초기화");
        chrome.storage.local.clear(function () {
          var error = chrome.runtime.lastError;
          if (error) {
            console.error(error);
          }
        });
      }
    });
  }

  renderMainInit(bookMarkTree, $app) {
    const lenX = 20;
    const lenY = 9;

    for (let y = 0; y < lenY; y++) {
      for (let x = 0; x < lenX; x++) {
        const $div = document.createElement("div");
        $div.className = `node-wrapper-${x}-${y}`;
        $app.appendChild($div);
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

    for (const bookMark of bookMarkTree) {
      if (bookMark.children == null) {
        if (filePos.y >= lenY) {
          const $wrapper = findEmpty($app);
          const tmp = $wrapper.className.split("-");
          filePos.x = parseInt(tmp[2]);
          filePos.y = parseInt(tmp[3]);
        }
        Storage.setPos(bookMark.id, filePos);
        new FileApp({
          $manager: $app,
          bookMark: bookMark,
          pos: filePos,
        });
        filePos.x++;
        if (filePos.x >= fileEndX) {
          filePos.x = fileInitX;
          filePos.y++;
        }
      } else {
        if (folderPos.y >= lenY) {
          const $wrapper = findEmpty($app);
          const tmp = $wrapper.className.split("-");
          folderPos.x = parseInt(tmp[2]);
          folderPos.y = parseInt(tmp[3]);
        }
        Storage.setPos(bookMark.id, folderPos);
        console.log(folderPos);
        new FolderApp({
          $app: $app,
          pos: folderPos,
          bookMark: bookMark,
        });
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
