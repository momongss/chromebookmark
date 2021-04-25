import FolderManager from "./FolderManager.js";

export default class Folder {
  constructor({ $manager, bookMark, mode, pos, onClick }) {
    this.$manager = $manager;
    this.$folder = document.createElement("div");
    this.$folder.className = "node folder";

    this.mode = mode;
    this.onClick = onClick;
    this.pos = pos;

    this.render(bookMark);
  }

  render(bookMark) {
    this.$folder = document.createElement("div");
    this.$folder.className = "node folder";
    this.$folder.dataset.id = bookMark.id;
    this.$folder.draggable = true;
    this.$folder.innerHTML = `
          <img id="logo-8f8894ba7a1f5c7a94a170b7dc841190" src="chrome-extension://${chrome.runtime.id}/assets/folder.svg" draggable=true alt="문서"></img>
          <div class="text" draggable=true>${bookMark.title}</div>
          <div class="drag-area"></div>
        `;

    this.$folder.addEventListener("click", (e) => {
      const $rect = this.$folder.getBoundingClientRect();
      const folderManager = new FolderManager({
        $app: this.$manager,
        bookMarkList: bookMark.children,
        title: bookMark.title,
        id: bookMark.id,
        initPos: { top: $rect.top, left: $rect.x },
      });
    });

    const $div = this.$manager.querySelector(
      `.node-wrapper-${this.pos.x}-${this.pos.y}`
    );
    $div.innerHTML = "";
    $div.appendChild(this.$folder);
  }
}
