import Storage from "../utils/storage.js";

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
    } else if (dragged.parentNode.parentNode.className === "folder-manager") {
      const rootTree = await getSubTree(rootId);
      const node = await getNode(dragged.dataset.id);
      for (const child of rootTree[0].children) {
        if (child.title === node.title) {
          const $div = dragged.querySelector("div");
          $div.innerHTML = node.title + "+";
          updatetitle(dragged.dataset.id, $div.innerHTML);
          break;
        }
      }

      moveTree(dragged.dataset.id, rootTree[0].id);
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
      const isContained = await searchTree(
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

    console.log($nodeWrapper);
    moveTree(dragged.dataset.id, target.dataset.id);
  }
}

function moveTree(id, destId) {
  chrome.bookmarks.move(id, {
    parentId: destId,
  });
}

function updatetitle(id, title) {
  chrome.bookmarks.update(id, {
    title: title,
  });
}

function removeDragged(dragged) {
  if (dragged.parentNode.parentNode.className === "app") {
    dragged.parentNode.removeChild(dragged);
  } else if (dragged.parentNode.parentNode.className === "folder-manager") {
    dragged.parentNode.remove();
  }
}

function getNode(id) {
  const getSubTree = new Promise((resolve) => {
    chrome.bookmarks.get(id, resolve);
  });

  return getSubTree.then((node) => node[0]);
}

function getSubTree(treeId) {
  const getSubTree = new Promise((resolve) => {
    chrome.bookmarks.getSubTree(treeId, resolve);
  });

  return getSubTree.then((subTree) => subTree);
}

async function searchTree(treeId, id) {
  const subTree = await getSubTree(treeId);
  return searchSubTree(subTree, id);
}

function searchSubTree(tree, id) {
  for (const subTree of tree) {
    if (subTree.id === id) {
      return true;
    } else if (subTree.children != null) {
      if (searchSubTree(subTree.children, id)) {
        return true;
      }
    }
  }
  return false;
}
