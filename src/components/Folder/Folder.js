import ItemNode from "../Node.js";
import OptionEdit from "../Options/OptionEdit.js";
import bookmarkManager from "../../utils/bookmark.js";

export default class Folder extends ItemNode {
  render() {
    this.innerHTML = "";

    this.$node = document.createElement("div");
    this.$node.className = "node folder";
    this.appendChild(this.$node);

    this.$node.dataset.id = this.bookMark.id;
    this.$node.innerHTML = `
          <img id="logo-8f8894ba7a1f5c7a94a170b7dc841190" src="chrome-extension://${chrome.runtime.id}/assets/folder.svg" alt="문서" draggable="false"></img>
          <div class="text">${this.bookMark.title}</div>
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

  eventListeners_app() {
    this.managerCnt = 0;

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

  eventListeners_folderManager(folderManager) {
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

  addItem(bookMark) {
    bookmarkManager.moveTree(bookMark.id, this.bookMark.id);
  }
}

customElements.define("folder-node", Folder);
