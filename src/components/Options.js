export default class Options {
  constructor({ $app }) {
    this.$app = $app;
    this.$file = document.createElement("a");
    this.$file.className = "node file";
    this.$file.draggable = true;
  }

  render(bookMark, x, y) {}

  findMyNode($el) {
    while ($el !== document.body) {
      if ($el.classList.contains("node")) {
        return $el;
      }
      $el = $el.parentElement;
    }
    return null;
  }
}
