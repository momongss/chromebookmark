export default class FolderManager {
  constructor({ $app, order }) {
    const $folderWrapper = document.createElement("div");
    $folderWrapper.className = `folder-manager-wrapper ${order}`;

    $app.appendChild($folderWrapper);

    this.$folderManagerWrapper = $folderWrapper;
    this.title = null;

    this.history = [];
  }

  render({ bookMarkList, title, id, mode }) {
    this.title = title;
    this.id = id;
    if (mode !== "back") {
      this.history.push({ bookMarkList: bookMarkList, title: title, id: id });
    }

    this.$folderManagerWrapper.innerHTML = "";
    this.$folderManagerWrapper.classList.add("show");

    const $header = document.createElement("div");
    $header.className = "folder-manager-header";
    $header.innerHTML = `
      <div class="folder-title">${title}</div>
      <button class="folder-close">x</div>
    `;

    const $closeBtn = $header.querySelector(".folder-close");
    $closeBtn.addEventListener("click", (e) => {
      this.title = null;
      this.$folderManagerWrapper.classList.remove("show");
      this.history = [];
    });

    const $folderManager = document.createElement("div");
    $folderManager.className = `folder-manager`;
    $folderManager.dataset.id = this.id;

    const $backBtn = document.createElement("div");
    $backBtn.className = "back-btn";
    if (this.history.length > 1) {
      $backBtn.innerHTML = "<";
    }
    $backBtn.addEventListener("click", (e) => {
      if (this.history.length === 1) return;
      this.history.pop();
      const preFolder = this.history[this.history.length - 1];
      this.render({
        bookMarkList: preFolder.bookMarkList,
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

    for (const bookMark of bookMarkList) {
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
            <div>${bookMark.title}</div>
          </div>
        `;
      $folderWrapper.addEventListener("click", (e) => {
        this.render({
          bookMarkList: bookMark.children,
          title: bookMark.title,
          id: bookMark.id,
        });
      });

      $folderManager.appendChild($folderWrapper);
    }

    for (const bookMark of fileBookMark) {
      const $fileWrapper = document.createElement("div");
      $fileWrapper.className = "node-wrapper";

      const faviconURL = `chrome://favicon/${bookMark.url}`;
      $fileWrapper.innerHTML = `
          <a href=${bookMark.url} class="node file" data-id=${bookMark.id} draggable=true>
            <img src="${faviconURL}"/>
            <div>${bookMark.title}</div>
          </a>
        `;

      $folderManager.appendChild($fileWrapper);
    }
  }
}

// 컴포넌트의 장점
// 다른 요소들을 신경쓸 필요없이 딱 하나의 컴포넌트에 집중하게 되어 생산성이 올라간다.
