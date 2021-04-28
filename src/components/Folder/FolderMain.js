import Folder from "./Folder.js";

export default class FolderMain extends Folder {
  constructor({ $manager, bookMark }) {
    super({
      bookMark: bookMark,
    });

    this.bookMark = bookMark;
    $manager.appendChild(this.$node);
  }
}
