import File from "./File.js";

export default class FileMain extends File {
  constructor({ $manager, bookMark }) {
    super({ bookMark });

    $manager.appendChild(this.$file);
  }
}
