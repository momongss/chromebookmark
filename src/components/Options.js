export default class Options {
  constructor({ $app }) {
    this.$app = $app;
    this.$file = document.createElement("a");
    this.$file.className = "node file";
    this.$file.draggable = true;
  }

  render(bookMark, x, y) {}
}
