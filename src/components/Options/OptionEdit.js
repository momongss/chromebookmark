import bookmarkManager from "../../utils/bookmark.js";
import { selectAll, clearSelection } from "../../utils/caret.js";
import { constDatas } from "../../utils/const.js";

export default class OptionEdit {
  constructor({ $target, x, y }) {
    const $nodeOptions = document.createElement("div");
    $nodeOptions.className = "options";
    $nodeOptions.innerHTML = `
          <div class="button edit"><img src="chrome-extension://${chrome.runtime.id}/assets/edit2.svg" /></div>
          <div class="button delete"><img src="chrome-extension://${chrome.runtime.id}/assets/delete.svg"></div>      
        `;
    this.$nodeOptions = $nodeOptions;
    this.$nodeOptions.style.top = `${y}px`;
    this.$nodeOptions.style.left = `${x}px`;
    this.$nodeOptions.style.display = "block";

    this.$edit = $nodeOptions.querySelector(".edit");
    this.$delete = $nodeOptions.querySelector(".delete");

    $target.appendChild($nodeOptions);

    this.eventListers();
  }

  eventListers() {
    this.$nodeOptions.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("Pointer down on options menu, preventing event propagation.");
    });

    this.$nodeOptions.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("Pointer down on options menu, preventing event propagation.");
    });

    this.$edit.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const $editTarget = this.findMyNode(e.target);

      console.log("Editing folder with ID:", $editTarget.dataset.id);

      const $title = $editTarget.querySelector(".text");
      $title.contentEditable = true;
      $title.classList.add("edit");
      selectAll($title);
      $title.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          $title.blur();
        }
      });

      $title.addEventListener("blur", (e) => {
        $title.contentEditable = false;
        $title.classList.remove("edit");
        clearSelection();
        const id = $editTarget.dataset.id;
        // 루트 폴더(0,1,2,3 또는 환경의 루트 ID)는 수정 불가
        const rootIds = new Set(["0", "1", "2", "3", String(constDatas.rootId || "")] );
        if (rootIds.has(id)) {
          console.warn('루트 폴더는 이름을 변경할 수 없습니다.');
          return;
        }
        chrome.bookmarks.update(id, { title: $title.textContent || '' });
      });
      this.$nodeOptions.remove();
    });

    this.$delete.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const $folder = this.$nodeOptions.parentElement;
      if ($folder && $folder.classList.contains("node")) {
        // 삭제 전에 커스텀 엘리먼트와 FolderManager 참조를 미리 획득
        const $customElement = $folder.parentElement;
        const folderManager = $customElement?.parentFolderManager;

        console.log("Attempting to delete folder with ID:", $folder.dataset.id);

        const subTree = await bookmarkManager.getSubTree($folder.dataset.id);
        if (subTree[0].children != null && subTree[0].children.length > 0) {
          const msg = chrome.i18n.getMessage("remove");
          console.log(msg, "msg");
          const answer = confirm(msg ? msg : "really delete folder?");

          if (answer) {
            await bookmarkManager.removeTree($folder.dataset.id);
            if ($customElement) $customElement.remove();
          }
        } else {
          console.log("Deleting folder with ID:", $folder.dataset.id);

          await bookmarkManager.remove($folder.dataset.id);
          if ($customElement) $customElement.remove();
        }
      }
      this.$nodeOptions.remove();
    });
  }

  findMyNode($el) {
    while ($el !== document.body) {
      if ($el.classList.contains("node")) {
        return $el;
      }
      $el = $el.parentElement;
    }
    return null;
  }
}
