import FolderManager from "../FolderManager.js";
import ItemNode from "../Node.js";
import OptionEdit from "../Options/OptionEdit.js";

export default class Folder extends ItemNode {
  Init({ $parent, bookMark, isRoot }) {
    this.bookMark = bookMark;

    this.$node = document.createElement("div");
    this.$node.className = "node folder";
    this.render(bookMark);
    this.eventListeners();

    this.appendChild(this.$node);
    $parent.appendChild(this);

    if (isRoot) this.#InitRoot();
    else this.#InitSearch();
  }

  #InitSearch() {}

  #InitRoot() {
    this.managerCnt = 0;

    this.$node.addEventListener("click", (e) => {
      const $rect = this.$node.getBoundingClientRect();
      const initPos = {
        top: $rect.top + this.managerCnt * 35,
        left: $rect.x + this.managerCnt * 35,
      };
      this.managerCnt++;
      new FolderManager({
        id: this.bookMark.id,
        initPos: initPos,
        onDestroy: () => {
          this.managerCnt--;
        },
      });
    });
  }

  render(bookMark) {
    this.$node.dataset.id = bookMark.id;
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

customElements.define("folder-node", Folder);
