import Storage from "../utils/storage.js";
import Bookmark from "../utils/bookmark.js";

export async function dropHandler(dragged, target, rootId) {
  if (!dragged.classList.contains("node")) return;

  if (target.parentNode.className === "app") {
    if (dragged.parentNode.parentNode.className === "app") {
      const tmp = target.className.split("-");
      const pos = {
        x: tmp[2],
        y: tmp[3],
      };
      Storage.setPos(dragged.dataset.id, pos);
    } else if (dragged.parentNode.className === "folder-manager") {
      const rootTree = await Bookmark.getSubTree(rootId);
      const node = await Bookmark.getNode(dragged.dataset.id);
      for (const child of rootTree[0].children) {
        if (child.title === node.title) {
          const $div = dragged.querySelector("div");
          $div.innerHTML = node.title + "+";
          Bookmark.updateBookmarktitle(dragged.dataset.id, $div.innerHTML);
          break;
        }
      }

      Bookmark.moveTree(dragged.dataset.id, rootTree[0].id);
      const tmp = target.className.split("-");
      const pos = {
        x: tmp[2],
        y: tmp[3],
      };
      Storage.setPos(dragged.dataset.id, pos);
    }

    removeDragged(dragged);
    target.style.background = "";
    target.appendChild(dragged);
  } else if (target.className === "folder-manager") {
    if (dragged.parentNode.parentNode.dataset.id === target.dataset.id) return;

    if (dragged.classList.contains("folder")) {
      const isContained = await Bookmark.searchTree(
        dragged.dataset.id,
        target.dataset.id
      );
      if (isContained) {
        alert("폴더는 자기 자신안으로 들어갈 수 없습니다.");
        return;
      }
    }

    removeDragged(dragged);
    const $nodeWrapper = document.createElement("div");
    $nodeWrapper.className = "node-wrapper";
    $nodeWrapper.appendChild(dragged);
    target.appendChild($nodeWrapper);

    console.log(dragged.dataset.id, target);
    Bookmark.moveTree(dragged.dataset.id, target.dataset.id);
  }
}

function removeDragged(dragged) {
  if (dragged.parentNode.parentNode.className === "app") {
    dragged.parentNode.removeChild(dragged);
  } else if (dragged.parentNode.parentNode.className === "folder-manager") {
    dragged.parentNode.remove();
  }
}
