import Folder from "./Folder.js";
import FolderManager from "../FolderManager.js";

export default class FolderApp extends Folder {
  constructor({ $app, bookMark: bookMark, pos, $target }) {
    super({
      bookMark: bookMark,
    });
    this.bookMark = bookMark;

    console.log(`.node-wrapper-${pos.x}-${pos.y}`);
    if ($target == null) {
      const $div = $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`);
      $div.innerHTML = "";
      $div.appendChild(this.$node);
    } else {
      $target.appendChild(this.$node);
    }

    this.$node.addEventListener("click", (e) => {
      const $rect = this.$node.getBoundingClientRect();
      new FolderManager({
        $app: $app,
        bookMarkList: this.bookMark.children,
        title: this.bookMark.title,
        id: this.bookMark.id,
        initPos: { top: $rect.top, left: $rect.x },
      });
    });
  }
}
