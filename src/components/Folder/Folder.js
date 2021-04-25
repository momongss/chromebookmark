import Node from "../Node.js";

export default class Folder extends Node {
  constructor({ bookMark }) {
    super();
    this.$node = document.createElement("div");
    this.$node.className = "node folder";
    // this.dragHandler();

    this.render(bookMark);
  }

  render(bookMark) {
    this.$node = document.createElement("div");
    this.$node.className = "node folder";
    this.$node.dataset.id = bookMark.id;
    this.$node.draggable = true;
    this.$node.innerHTML = `
          <img id="logo-8f8894ba7a1f5c7a94a170b7dc841190" src="chrome-extension://${chrome.runtime.id}/assets/folder.svg" draggable=true alt="문서"></img>
          <div class="text" draggable=true contenteditable=true>${bookMark.title}</div>
          <div class="drag-area"></div>
        `;
  }
}
