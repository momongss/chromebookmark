import Node from "../Node.js";
import OptionEdit from "../Options/OptionEdit.js";

export default class Folder extends Node {
  constructor({ bookMark }) {
    super();
    this.$node = document.createElement("div");
    this.$node.className = "node folder";
    this.eventListeners();

    this.render(bookMark);
  }

  render(bookMark) {
    this.bookMark = bookMark;
    this.$node.dataset.id = bookMark.id;
    this.$node.draggable = true;
    this.$node.innerHTML = `
          <img id="logo-8f8894ba7a1f5c7a94a170b7dc841190" src="chrome-extension://${chrome.runtime.id}/assets/folder.svg" draggable=true alt="문서"></img>
          <div class="text" draggable=true contenteditable=true>${bookMark.title}</div>
          <div class="drag-area"></div>
        `;
  }

  eventListeners() {
    document.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
    });

    this.$node.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });
      this.optionEdit = new OptionEdit({
        $target: this.$node,
        x: e.clientX,
        y: e.clientY,
      });
      this.$nodeOptions = this.optionEdit.$nodeOptions;
      if (e.target.parentElement === this.$node) {
      }
    });
  }
}
