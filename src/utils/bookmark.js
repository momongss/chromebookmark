class bookmark {
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
    chrome.bookmarks.remove(id, () => null);
  }

  async removeTree(treeId) {
    const tree = await this.getSubTree(treeId);
    this.history.push({ type: "remove", nodeInfo: tree[0] });
    chrome.bookmarks.removeTree(treeId, () => {});
  }

  async moveTree(id, destId) {
    await chrome.bookmarks.move(id, {
      parentId: destId,
    });
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
}

const Bookmark = new bookmark();
export default Bookmark;
