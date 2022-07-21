import Storage from "../utils/storage.js";
import Bookmark from "../utils/bookmark.js";

import FileApp from "../components/File/FileApp.js";
import FileMain from "../components/File/FileMain.js";
import FolderApp from "../components/Folder/FolderApp.js";
import FolderMain from "../components/Folder/FolderMain.js";
import { app } from "../../main.js";
import FolderManager from "../components/FolderManager.js";

export async function dropHandler(dragged, $target, rootId) {
  if (!dragged.classList.contains("node") || dragged === $target.parentElement)
    return;

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
    const tmp = $target.className.split("-");
    pos = {
      x: tmp[2],
      y: tmp[3],
    };

    if (dragged.parentNode.parentNode.className === "app") {
      Storage.setPos(dragged.dataset.id, pos);
    } else if (dragged.parentNode.parentNode.className === "folder-manager") {
      const rootTree = await Bookmark.getSubTree(rootId);
      await Bookmark.moveTree(dragged.dataset.id, rootTree[0].id);
    }
  } else if ($target.className === "folder-manager") {
    if (dragged.parentNode.parentNode.dataset.id === $target.dataset.id) return;

    if (dragged.classList.contains("folder")) {
      const isContained = await Bookmark.searchTree(
        dragged.dataset.id,
        $target.dataset.id
      );
      if (isContained) {
        return;
      }
    }

    await Bookmark.moveTree(dragged.dataset.id, $target.dataset.id);

    const folderManager = FolderManager.GetFolderManager($target.dataset.id);
  } else if ($target.parentElement.classList.contains("folder")) {
    $target = $target.parentElement;
    Bookmark.moveTree(dragged.dataset.id, $target.dataset.id);
    dragged.remove();
  }

  app.render();
}

function removeDragged(dragged) {
  if (dragged.parentNode.parentNode.className === "app") {
    dragged.remove();
  } else if (dragged.parentNode.parentNode.className === "folder-manager") {
    dragged.parentNode.remove();
  }
}
