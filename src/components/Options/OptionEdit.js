import Bookmark from "../../utils/bookmark.js";
import { selectAll, clearSelection } from "../../utils/caret.js";

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
    this.$edit.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const $editTarget = this.findMyNode(e.target);

      const $title = $editTarget.querySelector(".text");
      selectAll($title);
      $title.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          $title.blur();
        }
      });

      $title.addEventListener("blur", (e) => {
        clearSelection();
        chrome.bookmarks.update($editTarget.dataset.id, {
          title: $title.innerHTML,
        });
      });
      this.$nodeOptions.remove();
    });

    this.$delete.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const $folder = this.$nodeOptions.parentElement;
      if ($folder && $folder.classList.contains("node")) {
        const subTree = await Bookmark.getSubTree($folder.dataset.id);
        if (subTree[0].children != null && subTree[0].children.length > 0) {
          const answer = confirm("really delete folder?");
          if (answer) {
            Bookmark.removeTree($folder.dataset.id);
            $folder.remove();
          }
        } else {
          Bookmark.remove($folder.dataset.id);
          $folder.remove();
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
