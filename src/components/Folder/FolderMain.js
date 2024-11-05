import Folder from "./Folder.js";

export default class FolderMain {
  constructor({ $manager, bookMark }) {
    this.bookMark = bookMark;

    const $div = document.createElement("div");
    $div.className = "node-wrapper";
    $div.appendChild(this.$node);
    $manager.appendChild($div);

    this.$ = $div;
  }
}
