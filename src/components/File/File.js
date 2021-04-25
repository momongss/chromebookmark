import Node from "../Node.js";

export default class File extends Node {
  constructor({ bookMark }) {
    super();
    this.$node = document.createElement("a");
    this.$node.className = "node file";
    this.$node.draggable = true;
    // this.dragHandler();

    this.render(bookMark);
  }

  render(bookMark) {
    this.$node.href = bookMark.url;
    this.$node.dataset.id = bookMark.id;

    let faviconURL = `chrome://favicon/size/256@1x/${bookMark.url}`;
    if (bookMark.url.includes("youtube.com")) {
      faviconURL = "../../assets/youtube.svg";
    }
    this.$node.innerHTML = `
      <div class="file-wrapper">
        <img src="${faviconURL}" draggable=true/>
        <div class="text" draggable=true contenteditable=true>${bookMark.title}</div>
        <div class="drag-area"></div>
      </div>
    `;
  }
}
