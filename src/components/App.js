import FileApp from "./File/FileApp.js";
import FolderApp from "./Folder/FolderApp.js";

import Storage from "../utils/storage.js";
import { dropHandler } from "../utils/drop.js";
import { selectAll } from "../utils/caret.js";
import Bookmark from "../utils/bookmark.js";

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

    this.history = [];

    const $nodeOptions = document.createElement("div");
    $nodeOptions.className = "options";
    $nodeOptions.innerHTML = `
      <div class="button edit">수정</div>
      <div class="button delete">삭제</div>      
    `;

    const $createOptions = document.createElement("div");
    $createOptions.className = "options create";
    $createOptions.innerHTML = `
      <div class="button create-folder">새 폴더</div>
    `;

    this.$nodeOptions = $nodeOptions;
    this.$createOptions = $createOptions;

    $app.appendChild($nodeOptions);
    $app.appendChild($createOptions);

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
          $manager: $app,
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
        const file = new FileApp({
          $manager: $app,
          bookMark: bookMark,
          pos: pos,
        });
        Storage.setPos(bookMark.id, pos);
      } else {
        const folder = new FolderApp({
          $manager: $app,
          pos: pos,
          bookMark: bookMark,
        });
        const $wrapper = findEmpty($app);
        const tmp = $wrapper.className.split("-");
        const pos = {
          x: tmp[2],
          y: tmp[3],
        };
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

    document.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete")) {
        const nodeId = $editTarget.dataset.id;
        if ($editTarget.classList.contains("file")) {
          chrome.bookmarks.remove(nodeId);
        } else {
          let subTree = await Bookmark.getSubTree(nodeId);
          subTree = subTree[0];
          if (subTree.children.length === 0) {
            chrome.bookmarks.remove(nodeId);
          } else {
            const answer = confirm(
              `정말 이 폴더를 지우시겠습니까? : ${subTree.title}`
            );
            if (!answer) {
              this.$nodeOptions.style.display = "none";
              return;
            }
            const removingTree = chrome.bookmarks.removeTree(nodeId);
          }
        }
        $editTarget.remove();
      } else if (e.target.classList.contains("edit")) {
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
      } else if (e.target.classList.contains("create-folder")) {
        console.log("create");
      }

      this.$nodeOptions.remove();
      this.$createOptions.remove();
    });

    document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const $target = e.target.parentElement;
      console.log(e.target);

      this.$nodeOptions.remove();
      this.$createOptions.remove();
      if ($target.classList.contains("node")) {
        const $nodeOptions = document.createElement("div");
        $nodeOptions.className = "options";
        $nodeOptions.innerHTML = `
          <div class="button edit">수정</div>
          <div class="button delete">삭제</div>      
        `;
        $target.appendChild($nodeOptions);
        this.$nodeOptions = $nodeOptions;
        this.$nodeOptions.style.top = `${e.clientY}px`;
        this.$nodeOptions.style.left = `${e.clientX}px`;
        this.$nodeOptions.style.display = "block";
        $editTarget = $target;
      } else if ($target.parentElement.classList.contains("node")) {
        const $nodeOptions = document.createElement("div");
        $nodeOptions.className = "options";
        $nodeOptions.innerHTML = `
          <div class="button edit">수정</div>
          <div class="button delete">삭제</div>      
        `;
        this.$nodeOptions = $nodeOptions;
        $target.appendChild($nodeOptions);
        this.$nodeOptions.style.top = `${e.clientY}px`;
        this.$nodeOptions.style.left = `${e.clientX}px`;
        this.$nodeOptions.style.display = "block";
        $editTarget = $target.parentElement;
      } else {
        this.$createOptions.style.top = `${e.clientY}px`;
        this.$createOptions.style.left = `${e.clientX}px`;
        this.$createOptions.style.display = "block";
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
          $manager: $app,
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
