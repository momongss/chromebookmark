import File from "./File.js";

export default class FileApp extends File {
  constructor({ $manager, bookMark, pos }) {
    super({ bookMark });

    const $div = $manager.querySelector(`.node-wrapper-${pos.x}-${pos.y}`);
    console.log(pos, $div);

    $div.innerHTML = "";
    $div.appendChild(this.$node);

    this.$ = $div;
  }
}
