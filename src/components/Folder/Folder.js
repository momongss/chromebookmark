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
    this.removeEventListeners();

    this.addEventListener("contextmenu", this._handleContextMenu);
    document.addEventListener("click", this._handleDocumentClick);
  }

  removeEventListeners() {
    this.removeEventListener("contextmenu", this._handleContextMenu);
    document.removeEventListener("click", this._handleDocumentClick);
    this.removeEventListener("click", this._handleClickApp);
    this.removeEventListener("click", this._handleClickFolderManager);
  }

  _handleDocumentClick = (e) => {
    if (this.$nodeOptions) this.$nodeOptions.remove();
  };

  _handleContextMenu = (e) => {
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
  };

  eventListeners_app() {
    this.managerCnt = 0;
    this.addEventListener("click", this._handleClickApp);
  }

  _handleClickApp = (e) => {
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
  };

  eventListeners_folderManager(folderManager) {
    this._currentFolderManager = folderManager;
    this.addEventListener("click", this._handleClickFolderManager);
  }

  _handleClickFolderManager = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this._currentFolderManager.id = this.bookMark.id;
    this._currentFolderManager.render({ id: this.bookMark.id });
  };

  addItem(bookMark) {
    bookmarkManager.moveTree(bookMark.id, this.bookMark.id);
  }
}

customElements.define("folder-node", Folder);
