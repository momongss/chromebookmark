import Storage from "../utils/storage.js";
import Bookmark from "../utils/bookmark.js";

import FileApp from "../components/File/FileApp.js";
import FileMain from "../components/File/FileMain.js";
import FolderApp from "../components/Folder/FolderApp.js";
import FolderMain from "../components/Folder/FolderMain.js";

export async function dropHandler(dragged, $target, rootId) {
  if (!dragged.classList.contains("node") || dragged === $target.parentElement) return;

  let nodeType, nodeId;

  if (dragged.classList.contains("file")) {
    nodeType = "file";
  } else if (dragged.classList.contains("folder")) {
    nodeType = "folder";
  }

  nodeId = dragged.dataset.id;

  let bookMark = await Bookmark.getSubTree(nodeId);
  bookMark = bookMark[0];

  if ($target.parentNode.className === "app") {
    if ($target.childNodes.length > 0) return;
    let pos;

    if (dragged.parentNode.parentNode.className === "app") {
      const tmp = $target.className.split("-");
      pos = {
        x: tmp[2],
        y: tmp[3],
      };

      Storage.setPos(dragged.dataset.id, pos);
    } else if (dragged.parentNode.parentNode.className === "folder-manager") {
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
      const tmp = $target.className.split("-");
      pos = {
        x: tmp[2],
        y: tmp[3],
      };
      Storage.setPos(dragged.dataset.id, pos);
    }

    if (nodeType === "file") {
      new FileApp({
        $manager: $target.parentNode,
        bookMark: bookMark,
        pos: pos,
      });
    } else {
      new FolderApp({
        $app: $target.parentNode,
        bookMark: bookMark,
        pos: pos,
      });
    }

    removeDragged(dragged);
  } else if ($target.className === "folder-manager") {
    if (dragged.parentNode.parentNode.dataset.id === $target.dataset.id) return;

    if (dragged.classList.contains("folder")) {
      const isContained = await Bookmark.searchTree(dragged.dataset.id, $target.dataset.id);
      if (isContained) {
        return;
      }
    }

    if (nodeType === "file") {
      new FileMain({
        $manager: $target,
        bookMark: bookMark,
      });
    } else {
      new FolderMain({
        $manager: $target,
        bookMark: bookMark,
      });
    }

    removeDragged(dragged);
    Bookmark.moveTree(dragged.dataset.id, $target.dataset.id);
  } else if ($target.parentElement.classList.contains("folder")) {
    $target = $target.parentElement;
    Bookmark.moveTree(dragged.dataset.id, $target.dataset.id);
    dragged.remove();
  }
}

function removeDragged(dragged) {
  if (dragged.parentNode.parentNode.className === "app") {
    dragged.remove();
  } else if (dragged.parentNode.parentNode.className === "folder-manager") {
    dragged.remove();
  }
}
