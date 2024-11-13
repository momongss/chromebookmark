import Folder from "./Folder.js";

export default class FolderApp extends Folder {
  constructor({ $app, bookMark, pos, $target }) {
    super({
      bookMark: bookMark,
    });
    this.bookMark = bookMark;
    this.managerCnt = 0;

    if ($target == null) {
      const $div = $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`);
      $div.innerHTML = "";
      $div.appendChild(this.$node);
      this.$ = $div;
    } else {
      $target.appendChild(this.$node);
    }

    this.$node.addEventListener("click", (e) => {
      const $rect = this.$node.getBoundingClientRect();
      const initPos = {
        top: $rect.top + this.managerCnt * 35,
        left: $rect.x + this.managerCnt * 35,
      };
      this.managerCnt++;
      const folderManager = document.createElement("folder-manager");
      folderManager.Init({
        id: this.bookMark.id,
        initPos: initPos,
        onDestroy: () => {
          this.managerCnt--;
        },
      });
    });
  }
}
