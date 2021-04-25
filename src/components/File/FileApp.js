import File from "./File.js";

export default class FileApp extends File {
  constructor({ $manager, bookMark, pos }) {
    super({ bookMark });

    const $div = $manager.querySelector(`.node-wrapper-${pos.x}-${pos.y}`);
    $div.innerHTML = "";
    $div.appendChild(this.$file);
  }
}
