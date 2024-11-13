import ItemNode from "../Node.js";
import OptionEdit from "../Options/OptionEdit.js";

export default class FileNode extends ItemNode {
  Init(bookMark) {
    this.bookMark = bookMark;
    this.$node = document.createElement("a");
    this.$node.className = "node file";
    this.appendChild(this.$node);
    this.render();
    this.eventListeners();

    console.log(bookMark);
  }

  Init_App({ $parent, bookMark }) {
    this.Init(bookMark);
    $parent.innerHTML = "";
    $parent.appendChild(this);
  }

  Init_Manage({ $parent, bookMark }) {
    this.Init(bookMark);
    $parent.appendChild(this);
  }

  getFaviconURL(u) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "32");
    return url.toString();
  }

  render() {
    if (!this.bookMark) return;

    this.$node.href = this.bookMark.url;
    this.$node.dataset.id = this.bookMark.id;

    let faviconURL = this.getFaviconURL(this.bookMark.url);
    if (this.bookMark.url.includes("youtube.com")) {
      faviconURL = "../../assets/youtube.svg";
    }

    this.$node.innerHTML = `
      <div class="file-wrapper">
        <img src="${faviconURL}"/>
        <div class="text"contenteditable=true>${this.bookMark.title}</div>
        <div class="drag-area"></div>
      </div>
    `;
  }

  eventListeners() {
    document.addEventListener("click", () => {
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
    });
  }
}

customElements.define("file-node", FileNode);
