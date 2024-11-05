import FileNode from "./File.js";

export default class FileApp extends FileNode {
  constructor() {
    super();
  }

  Init({ $parent, bookMark }) {
    super.Init(bookMark);
    $parent.innerHTML = "";
    $parent.appendChild(this);
  }
}

customElements.define("file-app-node", FileApp);
