import FileMain from "./File/FileMain.js";
import FolderMain from "./Folder/FolderMain.js";
import { FolderManagerData } from "../utils/FolderManagerData.js";

export default class FolderManager {
  constructor({ $app, bookMarkList: bookMarkTree, title, id, initPos }) {
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

    this.$folderManagerWrapper = $folderWrapper;

    this.history = [];
    this.pos = initPos;

    this.render({
      bookMarkTree: bookMarkTree,
      title: title,
      id: id,
      pos: initPos,
    });
  }

  dragEventHandler($header) {
    let dragged = false;
    let initX, initY;
    let folderX, folderY;

    $header.addEventListener("mousedown", (e) => {
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

    document.addEventListener("mousemove", (e) => {
      if (dragged) {
        this.$folderManagerWrapper.style.top = `${
          folderY + e.clientY - initY
        }px`;
        this.$folderManagerWrapper.style.left = `${
          folderX + e.clientX - initX
        }px`;
      }
    });

    $header.addEventListener("mouseup", (e) => {
      dragged = false;
    });
  }

  render({ bookMarkTree, title, id, mode }) {
    if (mode !== "back") {
      this.history.push({
        bookMarkList: bookMarkTree,
        title: title,
        id: id,
      });
    }

    this.$folderManagerWrapper.innerHTML = "";
    this.$folderManagerWrapper.classList.add("show");
    this.$folderManagerWrapper.style.top = `${this.pos.top}px`;
    this.$folderManagerWrapper.style.left = `${
      this.pos.left < 400 ? 0 : this.pos.left - 400
    }px`;

    const $header = document.createElement("div");
    $header.className = "folder-manager-header";
    $header.innerHTML = `
      <div class="folder-title">${title}</div>
      <button class="folder-close">x</button>
    `;

    this.dragEventHandler($header);

    const $closeBtn = $header.querySelector(".folder-close");
    $closeBtn.addEventListener("click", (e) => {
      this.$folderManagerWrapper.remove();
      this.history = [];
    });

    const $folderManager = document.createElement("div");
    $folderManager.className = `folder-manager`;
    $folderManager.dataset.id = id;

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
        bookMarkTree: preFolder.bookMarkList,
        title: preFolder.title,
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
        onClick: () => {
          console.log("hit");
          this.render({
            bookMarkTree: bookMark.children,
            title: bookMark.title,
            id: bookMark.id,
          });
        },
      });
    }

    for (const bookMark of fileBookMark) {
      new FileMain({
        $manager: $folderManager,
        bookMark: bookMark,
      });
    }
  }
}

// 컴포넌트의 장점
// 다른 요소들을 신경쓸 필요없이 딱 하나의 컴포넌트에 집중하게 되어 생산성이 올라간다.