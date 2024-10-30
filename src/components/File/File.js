import OptionEdit from "../Options/OptionEdit.js";

class FileNode extends HTMLElement {
  constructor() {
    super();
  }

  Init() {
    this.attachShadow({ mode: "open" });
    this.$node = document.createElement("a");
    this.$node.className = "node file";
    this.shadowRoot.appendChild(this.$node);

    this.eventListeners();
  }

  static get observedAttributes() {
    return ["book-mark"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "book-mark" && newValue) {
      this.bookMark = JSON.parse(newValue);
      this.render();
    }
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
        <img src="${faviconURL}" draggable=true/>
        <div class="text" draggable=true contenteditable=true>${this.bookMark.title}</div>
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

console.log("dd");
customElements.define("file-node", FileNode);
console.log("dd");

export default FileNode;
