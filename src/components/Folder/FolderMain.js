import Folder from "./Folder.js";

export default class FolderMain extends Folder {
  constructor({ $manager, bookMark, onClick }) {
    super({
      bookMark: bookMark,
    });

    this.$folder.addEventListener("click", onClick.bind(this));
    $manager.appendChild(this.$folder);
  }
}
