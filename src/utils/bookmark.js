export default class Bookmark {
  static getSubTree(treeId) {
    const subTree = new Promise((resolve) => {
      chrome.bookmarks.getSubTree(treeId, resolve);
    });

    return subTree.then((subTree) => subTree);
  }

  static moveTree(id, destId) {
    chrome.bookmarks.move(id, {
      parentId: destId,
    });
  }

  static updateBookmarktitle(id, title) {
    chrome.bookmarks.update(id, {
      title: title,
    });
  }

  static getNode(id) {
    const subTree = new Promise((resolve) => {
      chrome.bookmarks.get(id, resolve);
    });

    return subTree.then((node) => node[0]);
  }

  static async searchTree(treeId, id) {
    const subTree = await this.getSubTree(treeId);
    return this.searchSubTree(subTree, id);
  }

  static searchSubTree(tree, id) {
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
