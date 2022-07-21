const storage = chrome.storage.local;
const mainKey = "e352cadab3cc08";

export default class Storage {
  static async removeInfo(id) {
    this.setPos(id, null);
  }

  static async setBackgroundImage(src) {
    this.setItem("background-image", src);
  }

  static async getBackgroundImage() {
    return await this.getItem("background-image");
  }

  static async getPos(id) {
    const pos = await this.getItem(`mainPos${id}`);

    if (pos == null) {
      return;
    }

    pos.x = parseInt(pos.x);
    pos.y = parseInt(pos.y);
    return pos;
  }

  static async setPos(id, mainPos) {
    if (mainPos == null) return;

    return await this.setItem(`mainPos${id}`, mainPos);
  }

  static async getState() {
    return await this.getItem(`state`);
  }

  static async setState(state) {
    return await this.setItem(`state`, state);
  }

  static getItem(key) {
    let gettingItem = new Promise((resolve) =>
      storage.get(mainKey + key, resolve)
    );

    return gettingItem.then((re) => {
      if (Object.keys(re).length === 0 && re.constructor === Object) {
        return null;
      }
      return re[mainKey + key];
    });
  }

  static setItem(key, data) {
    return new Promise((resolve) => {
      storage.set(
        {
          [mainKey + key]: data,
        },
        resolve
      );
    }).catch((err) => {
      console.error(err);
    });
  }
}
