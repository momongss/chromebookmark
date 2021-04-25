import Folder from "./Folder.js";
import FolderManager from "../FolderManager.js";

export default class FolderApp extends Folder {
  constructor({ $manager, bookMark, pos }) {
    super({
      bookMark: bookMark,
    });

    this.pos = pos;
    this.$manager = $manager;

    this.$node.addEventListener("click", (e) => {
      const $rect = this.$node.getBoundingClientRect();
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
    $div.appendChild(this.$node);
  }
}
