import FileApp from "./File/FileApp.js";
import FolderApp from "./Folder/FolderApp.js";

import OptionEdit from "./Options/OptionEdit.js";
import OptionCreate from "./Options/OptionCreate.js";

import Storage from "../utils/storage.js";
import Bookmark from "../utils/bookmark.js";

import { dropHandler } from "../utils/drop.js";
import { selectAll } from "../utils/caret.js";
import { constDatas } from "../utils/const.js";

export default class App {
  constructor({ $app }) {
    this._constructor($app);
  }

  async _constructor($app) {
    // https://wallpaperaccess.com/aesthetic-gif
    document.body.style.backgroundImage = `url("chrome-extension://${chrome.runtime.id}/assets/sky_good.jpg")`;
    const rootTree = await this.getBookMarkList();
    const bookMarkTree = rootTree.children;
    this.rootId = rootTree.id;
    constDatas.rootId = this.rootId;

    this.history = [];

    const $nodeOptions = document.createElement("div");
    $nodeOptions.className = "options";
    $nodeOptions.innerHTML = `
      <div class="button edit">수정</div>
      <div class="button delete">삭제</div>      
    `;

    this.$nodeOptions = $nodeOptions;

    $app.appendChild($nodeOptions);

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
    const lenY = 8;

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
        if (filePos == null) {
          posUndefineds.push(bookMark);
          continue;
        }
        const file = new FileApp({
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

        const folder = new FolderApp({
          $app: $app,
          pos: folderPos,
          bookMark: bookMark,
        });
      }
    }

    for (const bookMark of posUndefineds) {
      console.log(bookMark);
      if (bookMark.children == null) {
        const $wrapper = findEmpty($app);
        const tmp = $wrapper.className.split("-");
        const pos = {
          x: tmp[2],
          y: tmp[3],
        };
        const file = new FileApp({
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
        folder.render(bookMark, pos.x, pos.y);
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
  }

  eventListeners() {
    let $dragged;
    let $editTarget;

    document.addEventListener(
      "click",
      async (e) => {
        if (e.target.classList.contains("delete")) {
          // e.stopPropagation();
          // e.preventDefault();
          // const nodeId = $editTarget.dataset.id;
          // if ($editTarget.classList.contains("file")) {
          //   chrome.bookmarks.remove(nodeId);
          // } else {
          //   let subTree = await Bookmark.getSubTree(nodeId);
          //   subTree = subTree[0];
          //   if (subTree.children.length === 0) {
          //     chrome.bookmarks.remove(nodeId);
          //   } else {
          //     const answer = confirm(
          //       `정말 이 폴더를 지우시겠습니까? : ${subTree.title}`
          //     );
          //     if (!answer) {
          //       this.$nodeOptions.style.display = "none";
          //       return;
          //     }
          //     const removingTree = chrome.bookmarks.removeTree(nodeId);
          //   }
          // }
          // $editTarget.remove();
        } else if (e.target.classList.contains("edit")) {
          e.stopPropagation();
          e.preventDefault();
          const $title = $editTarget.querySelector(".text");
          selectAll($title);
          $title.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              $title.blur();
            }
          });

          $title.addEventListener("blur", (e) => {
            chrome.bookmarks.update($editTarget.dataset.id, {
              title: $title.innerHTML,
            });
          });
        }

        if (this.$nodeOptions) this.$nodeOptions.remove();
        if (this.$createOptions) this.$createOptions.remove();
      },
      true
    );

    this.$app.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const $target = e.target.parentElement;

      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();

      if ($target.classList.contains("node")) {
        // const optionEdit = new OptionEdit({
        //   $target: $target,
        //   x: e.clientX,
        //   y: e.clientY,
        // });
        // this.$nodeOptions = optionEdit.$nodeOptions;
        // $editTarget = $target;
      } else if ($target.parentElement.classList.contains("node")) {
        // new OptionEdit({ $target: $target, x: e.clientX, y: e.clientY });
        // $editTarget = $target.parentElement;
      } else if (e.target.className.includes("node-wrapper")) {
        console.log("here");
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
      if (e.target.className.includes("node-wrapper")) {
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
    const lenY = 8;

    for (let y = 0; y < lenY; y++) {
      for (let x = 0; x < lenX; x++) {
        const $div = document.createElement("div");
        $div.className = `node-wrapper-${x}-${y}`;
        $app.appendChild($div);
      }
    }

    const fileInitX = 9;
    const fileEndX = 14;
    const folderInitX = 4;
    const folderEndX = 8;

    const filePos = { x: fileInitX, y: 1 };
    const folderPos = { x: folderInitX, y: 1 };

    for (const bookMark of bookMarkTree) {
      if (bookMark.children == null) {
        Storage.setPos(bookMark.id, filePos);
        filePos.x++;
        if (filePos.x >= fileEndX) {
          filePos.x = fileInitX;
          filePos.y++;
        }
        const file = new FileApp({
          $manager: $app,
          bookMark: bookMark,
          pos: filePos,
        });
      } else {
        Storage.setPos(bookMark.id, folderPos);
        folderPos.x++;
        if (folderPos.x >= folderEndX) {
          folderPos.x = folderInitX;
          folderPos.y++;
        }
        const folder = new FolderApp({
          $app: $app,
          pos: folderPos,
          bookMark: bookMark,
        });
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
