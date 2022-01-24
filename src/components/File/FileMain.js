import File from "./File.js";

export default class FileMain extends File {
  constructor({ $manager, bookMark }) {
    super({ bookMark });

    const $div = document.createElement("div");
    $div.className = "node-wrapper";
    $div.appendChild(this.$node);
    $manager.appendChild($div);

    this.$ = $div;
  }
}
