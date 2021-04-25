export default class FolderManager {
  constructor({ $app, bookMarkList: bookMarkTree, title, id, initPos }) {
    const $folderWrapper = document.createElement("div");
    $folderWrapper.className = `folder-manager-wrapper`;

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
      const $folderWrapper = document.createElement("div");
      $folderWrapper.className = "node-wrapper";
      $folderWrapper.innerHTML = `
          <div class="node folder" data-id=${bookMark.id} draggable=true>
            <img id="logo-8f8894ba7a1f5c7a94a170b7dc841190" src="chrome-extension://${chrome.runtime.id}/assets/folder.svg" alt="문서"></img>
            <div class="text">${bookMark.title}</div>
            <div class="drag-area"></div>
          </div>
        `;
      $folderWrapper.addEventListener("click", (e) => {
        this.render({
          bookMarkTree: bookMark.children,
          title: bookMark.title,
          id: bookMark.id,
        });
      });

      $folderManager.appendChild($folderWrapper);
    }

    for (const bookMark of fileBookMark) {
      const $fileWrapper = document.createElement("div");
      $fileWrapper.className = "node-wrapper";

      let faviconURL = `chrome://favicon/size/256@1x/${bookMark.url}`;
      if (bookMark.url.includes("youtube.com")) {
        faviconURL = "../../assets/youtube.svg";
      }
      $fileWrapper.innerHTML = `
          <a href=${bookMark.url} class="node file" data-id=${bookMark.id} draggable=true>
            <div class="file-wrapper">
              <img src="${faviconURL}"/>
              <div class="text">${bookMark.title}</div>
              <div class="drag-area"></div>
            </div>
          </a>
        `;

      $folderManager.appendChild($fileWrapper);
    }
  }
}

// 컴포넌트의 장점
// 다른 요소들을 신경쓸 필요없이 딱 하나의 컴포넌트에 집중하게 되어 생산성이 올라간다.
