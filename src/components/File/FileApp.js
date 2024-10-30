import FileNode from "./File.js";

export default class FileApp extends FileNode {
  constructor() {
    super();
  }

  Init({ $manager, pos }) {
    super();
    const $div = $manager.querySelector(`.node-wrapper-${pos.x}-${pos.y}`);
    $div.innerHTML = "";
    $div.appendChild(this.$node);

    this.$ = $div;
  }
}

customElements.define("file-app-node", FileAppNode);
