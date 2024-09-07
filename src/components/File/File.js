import Node from "../Node.js";
import OptionEdit from "../Options/OptionEdit.js";

export default class File extends Node {
  constructor({ bookMark }) {
    super({ bookMark });

    this.$node = document.createElement("a");
    this.$node.className = "node file";
    this.$node.draggable = true;
    this.eventListeners();

    this.render(bookMark);
  }

  faviconURL(u) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "32");
    return url.toString();
  }

  render(bookMark) {
    this.$node.href = bookMark.url;
    this.$node.dataset.id = bookMark.id;

    let faviconURL = this.faviconURL(bookMark.url);
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
