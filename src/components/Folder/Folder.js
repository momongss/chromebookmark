import bookmarkManager from "../../utils/bookmark.js";
import ItemNode from "../Node.js";
import OptionEdit from "../Options/OptionEdit.js";

export default class Folder extends ItemNode {
  Init({ $parent, bookMark, isRoot, folderManager }) {
    this.bookMark = bookMark;

    this.$node = document.createElement("div");
    this.$node.className = "node folder";
    this.render(bookMark);
    this.eventListeners();

    this.appendChild(this.$node);
    $parent.appendChild(this);

    this.isRoot = isRoot;

    if (isRoot) this.#InitRoot();
    else this.#InitSearch(folderManager);
  }

  #InitSearch(folderManager) {
    this.addEventListener("click", (e) => {      
      // 드래그 거리가 충분한 경우 클릭 이벤트 무시
      if (this.startX !== null && this.startY !== null) {
        const distance = this.calculateDistance(
          { x: this.startX, y: this.startY },
          { x: e.clientX, y: e.clientY }
        );
        if (distance > 5) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
      
      e.preventDefault();
      e.stopPropagation();
      folderManager.id = this.bookMark.id;
      folderManager.render({ id: this.bookMark.id });


    });
  }

  #InitRoot() {
    this.managerCnt = 0;

    this.addEventListener("pointerdown", (e) => {
      this.style.backgroundColor = "red";

      console.log("pointerdown222 red");
    });

    this.addEventListener("click", (e) => {
      const $rect = this.$node.getBoundingClientRect();
      const initPos = {
        top: $rect.top + this.managerCnt * 35,
        left: $rect.x + this.managerCnt * 35,
      };
      this.managerCnt++;
      const folderManager = document.createElement("folder-manager");
      folderManager.Init({
        id: this.bookMark.id,
        initPos: initPos,
        onDestroy: () => {
          this.managerCnt--;
        },
      });
    });
  }

  addItem(bookMark) {
    bookmarkManager.moveTree(bookMark.id, this.bookMark.id);
  }

  render(bookMark) {
    this.$node.dataset.id = bookMark.id;
    this.$node.innerHTML = `
          <img id="logo-8f8894ba7a1f5c7a94a170b7dc841190" src="chrome-extension://${chrome.runtime.id}/assets/folder.svg" alt="문서"></img>
          <div class="text">${bookMark.title}</div>
        `;
  }

  eventListeners() {
    document.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
    });

    this.addEventListener("contextmenu", (e) => {
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
