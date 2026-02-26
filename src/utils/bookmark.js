class BookmarkManager {
  constructor() {
    this.history = [];
  }

  getSubTree(treeId) {
    const subTree = new Promise((resolve) => {
      chrome.bookmarks.getSubTree(treeId, resolve);
    });

    return subTree.then((subTree) => subTree);
  }

  async remove(id) {
    const node = await this.getNode(id);
    this.history.push({
      type: "remove",
      nodeInfo: {
        parentId: node.parentId,
        title: node.title,
        url: node.url,
      },
    });
    await chrome.bookmarks.remove(id);
  }

  async removeTree(treeId) {
    const tree = await this.getSubTree(treeId);
    this.history.push({ type: "remove", nodeInfo: tree[0] });
    await chrome.bookmarks.removeTree(treeId);
  }

  moveTree(id, destId) {
    chrome.bookmarks.move(id, {
      parentId: destId,
    });
  }

  async hasNodeInTree(id, treeId) {
    const [node] = await chrome.bookmarks.get(id);
    return node?.parentId == treeId;
  }

  updateBookmarktitle(id, title) {
    chrome.bookmarks.update(id, {
      title: title,
    });
  }

  getNode(id) {
    const subTree = new Promise((resolve) => {
      chrome.bookmarks.get(id, resolve);
    });

    return subTree.then((node) => node[0]);
  }

  async searchTree(treeId, id) {
    const subTree = await this.getSubTree(treeId);
    return this.searchSubTree(subTree, id);
  }

  searchSubTree(tree, id) {
    for (const subTree of tree) {
      if (subTree.id === id) {
        return true;
      } else if (subTree.children != null) {
        if (this.searchSubTree(subTree.children, id)) {
          return true;
        }
      }
    }
    return false;
  }
  // 루트(0)부터 해당 폴더까지의 조상 경로를 배열로 반환 [{id, title}, ...]
  async getAncestorPath(folderId) {
    const path = [];
    let currentId = folderId;
    while (currentId && currentId !== '0') {
      try {
        const node = await this.getNode(currentId);
        if (!node) break;
        path.unshift({ id: node.id, title: node.title });
        currentId = node.parentId;
      } catch { break; }
    }
    return path;
  }
}

const bookmarkManager = new BookmarkManager();
export default bookmarkManager;
