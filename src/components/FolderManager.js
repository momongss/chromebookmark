import FileMain from "./File/FileMain.js";
import FolderMain from "./Folder/FolderMain.js";
import OptionCreate from "./Options/OptionCreate.js";

import Bookmark from "../utils/bookmark.js";

import { FolderManagerData } from "../utils/FolderManagerData.js";

export default class FolderManager {
  constructor({ $app, id, initPos, onDestroy }) {
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

    $app.appendChild($folderWrapper);

    this.$app = $app;

    this.$folderManagerWrapper = $folderWrapper;

    this.history = [];

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
    const subTree = await Bookmark.getSubTree(id);
    const title = subTree[0].title;
    const bookMarkTree = subTree[0].children;
    if (mode !== "back") {
      this.history.push({
        id: id,
      });
    }
    this.$folderManagerWrapper.innerHTML = "";
    this.$folderManagerWrapper.classList.add("show");
    this.$folderManagerWrapper.style.top = `${this.pos.top}px`;
    this.$folderManagerWrapper.style.left = `${this.pos.left}px`;

    const $header = document.createElement("div");
    $header.className = "folder-manager-header";
    $header.innerHTML = `
      <div class="folder-title">${title}</div>
      <div class="folder-close">x</div>
    `;

    this.dragListener($header);

    const $closeBtn = $header.querySelector(".folder-close");
    $closeBtn.addEventListener("click", (e) => {
      this.$folderManagerWrapper.remove();
      this.history = [];
      this.onDestroy();
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

    const $backBtn = document.createElement("div");
    $backBtn.className = "back-btn";
    if (this.history.length > 1) {
      $backBtn.innerHTML = "<";
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

    $folderManager.appendChild($backBtn);

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

    folderBookMark.sort((a, b) => {
      return b.dateGroupModified - a.dateGroupModified;
    });

    fileBookMark.sort((a, b) => {
      return b.dateAdded - a.dateAdded;
    });

    for (const bookMark of folderBookMark) {
      new FolderMain({
        $manager: $folderManager,
        bookMark,
      });
    }

    for (const bookMark of fileBookMark) {
      new FileMain({
        $manager: $folderManager,
        bookMark: bookMark,
      });
    }

    this.rightClickHandler();
  }
}

// 컴포넌트의 장점
// 다른 요소들을 신경쓸 필요없이 딱 하나의 컴포넌트에 집중하게 되어 생산성이 올라간다.
