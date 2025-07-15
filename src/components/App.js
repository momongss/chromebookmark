import FolderManager from "./FolderManager.js";
import RectDragger from "../utils/rectangleDrag.js";
import Wallpaper from "./Wallpaper/Wallpaper.js";
import ImageManager from "./Image/ImageManager.js";
import PostItManager from "./PostIt/PostItManager.js";

import OptionCreate from "./Options/OptionCreate.js";

import Storage from "../utils/storage.js";

import { constDatas } from "../utils/const.js";
import DropHandlerApp from "../utils/dropHandlerApp.js";

import FileNode from "./File/File.js";
import FolderNode from "./Folder/Folder.js";

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
    this.$imageManager = new ImageManager($app);
    this.$postItManager = new PostItManager($app);
    
    // 포스트잇 매니저를 전역으로 설정
    window.postItManager = this.$postItManager;

    const state = await Storage.getState();

    state
      ? this.renderRunned(bookMarkTree, $app)
      : this.renderMainInit(bookMarkTree, $app);

    const dragger = document.createElement("rect-dragger");
    $app.appendChild(dragger);
    dragger.Init($app);

    this.eventListeners();

    this.dropHandlerApp = new DropHandlerApp($app);
  }

  eventListeners() {
    document.addEventListener("click", async (e) => {
      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });
      document.querySelectorAll(".post-it-context-menu").forEach(($el) => {
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
      document.querySelectorAll(".post-it-context-menu").forEach(($el) => {
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

    // Add drop event listener
    this.$app.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.$app.addEventListener('drop', async (e) => {
      e.preventDefault();
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const image = {
              src: event.target.result,
              x: e.clientX - this.$app.getBoundingClientRect().left,
              y: e.clientY - this.$app.getBoundingClientRect().top,
              width: 200,
              height: 200
            };
            await Storage.addImage(image);
            this.createImageElement(image);
          };
          reader.readAsDataURL(file);
        }
      }
    });

    this.$app.addEventListener("pointerdown", (e) => {
      // 바탕화면에서만 동작: 노드, 폴더매니저, rect-dragger가 아닌 곳만
      const tag = e.target.tagName.toLowerCase();
      const isNode = tag.includes('node');
      const isManager = tag.includes('folder-manager');
      const isDragger = tag.includes('rect-dragger');
      if (!isNode && !isManager && !isDragger) {
        document.querySelectorAll('.multi').forEach(el => {
          el.classList.remove('multi');
          if (el.firstElementChild) el.firstElementChild.classList.remove('selected');
        });
      }
    });
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
      const pos = await Storage.getPos(bookMark.id);
      if (pos == null) {
        posUndefineds.push(bookMark);
        continue;
      }
      else {
        if (bookMark.children == null) {
          const fileNode = new FileNode();
          fileNode.Init({
            $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
            bookMark: bookMark,
          });
        } else {
          const folderNode = new FolderNode();
          folderNode.Init({
            $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
            bookMark: bookMark,
          });
        }
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
        const fileNode = new FileNode();
        fileNode.Init({
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
        const folderNode = new FolderNode();
        folderNode.Init({
          $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
          bookMark: bookMark,
        });
        Storage.setPos(bookMark.id, pos);
      }
    }
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

        const fileNode = new FileNode();
        fileNode.Init({
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

        const folderNode = new FolderNode();
        folderNode.Init({
          $parent: $app.querySelector(
            `.node-wrapper-${folderPos.x}-${folderPos.y}`
          ),
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
