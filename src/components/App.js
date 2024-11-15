import FileApp from "./File/FileApp.js";
import FolderApp from "./Folder/FolderApp.js";
import FolderManager from "./FolderManager.js";
import RectDragger from "../utils/rectangleDrag.js";
import Wallpaper from "./Wallpaper/Wallpaper.js";

import OptionCreate from "./Options/OptionCreate.js";

import Storage from "../utils/storage.js";

import { dropHandler } from "../utils/drop.js";
import { constDatas } from "../utils/const.js";

export default class App {
  static $dom;

  constructor({ $app }) {
    this.$dom = this;
    this._constructor($app);
  }

  async _constructor($app) {
    // https://wallpaperaccess.com/aesthetic-gif

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

    const dragger = document.createElement("rect-dragger");
    $app.appendChild(dragger);
    dragger.Init($app);

    this.eventListeners();
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

    for (const bookMark of bookMarkTree) {
      if (bookMark.children == null) {
        const pos = await Storage.getPos(bookMark.id);
        if (
          pos == null ||
          (pos.constructor === Object && Object.keys(pos).length === 0)
        ) {
          posUndefineds.push(bookMark);
          continue;
        }

        const fileNode = document.createElement("file-node");
        fileNode.Init_App({
          $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
          bookMark: bookMark,
        });
      } else {
        const pos = await Storage.getPos(bookMark.id);
        if (pos == null) {
          posUndefineds.push(bookMark);
          continue;
        }

        const folderNode = document.createElement("folder-node");
        folderNode.Init({
          $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
          bookMark: bookMark,
          isRoot: true,
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
        const fileNode = document.createElement("file-node");
        fileNode.Init_App({
          $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
          bookMark: bookMark,
        });

        Storage.setPos(bookMark.id, pos);
      } else {
        const $wrapper = findEmpty($app);
        const tmp = $wrapper.className.split("-");
        const pos = {
          x: tmp[2],
          y: tmp[3],
        };
        const folderNode = document.createElement("folder-node");
        folderNode.Init({
          $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
          bookMark: bookMark,
          isRoot: true,
        });
        Storage.setPos(bookMark.id, pos);
      }
    }
  }

  eventListeners() {
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

        const fileNode = document.createElement("file-node");
        fileNode.Init_App({
          $parent: $app.querySelector(
            `.node-wrapper-${filePos.x}-${filePos.y}`
          ),
          bookMark: bookMark,
        });

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

        const folderNode = document.createElement("folder-node");
        folderNode.Init({
          $parent: $app.querySelector(
            `.node-wrapper-${folderPos.x}-${folderPos.y}`
          ),
          bookMark: bookMark,
          isRoot: true,
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
