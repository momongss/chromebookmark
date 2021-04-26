import Folder from "./Folder.js";

export default class FolderMain extends Folder {
  constructor({ $manager, bookMark, onClick }) {
    super({
      bookMark: bookMark,
    });

    this.bookMark = bookMark;

    this.$node.addEventListener("click", onClick.bind(this));
    $manager.appendChild(this.$node);
  }
}
