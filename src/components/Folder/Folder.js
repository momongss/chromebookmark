export default class Folder {
  constructor({ bookMark }) {
    this.$folder = document.createElement("div");
    this.$folder.className = "node folder";

    this.render(bookMark);
  }

  render(bookMark) {
    this.$folder = document.createElement("div");
    this.$folder.className = "node folder";
    this.$folder.dataset.id = bookMark.id;
    this.$folder.draggable = true;
    this.$folder.innerHTML = `
          <img id="logo-8f8894ba7a1f5c7a94a170b7dc841190" src="chrome-extension://${chrome.runtime.id}/assets/folder.svg" draggable=true alt="문서"></img>
          <div class="text" draggable=true contenteditable=true>${bookMark.title}</div>
          <div class="drag-area"></div>
        `;
  }
}
