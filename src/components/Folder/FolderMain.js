import Folder from "./Folder.js";

export default class FolderMain extends Folder {
  constructor({ $manager, bookMark }) {
    super({
      bookMark: bookMark,
    });

    this.bookMark = bookMark;

    const $div = document.createElement("div");
    $div.className = "node-wrapper";
    $div.appendChild(this.$node);
    $manager.appendChild($div);
  }
}
