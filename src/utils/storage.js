const storage = chrome.storage.local;
const mainKey = "e352cadab3cc08";

export default class Storage {
  // User settings (grid/tile) helpers
  static async getUserSettings() {
    const settings = await this.getItem("user-settings");
    return settings || null;
  }

  static async setUserSettings(settings) {
    return await this.setItem("user-settings", settings);
  }

  static async removeInfo(id) {
    this.setPos(id, null);
  }

  static async setBackgroundImage(src) {
    this.setItem("background-image", src);
  }

  static async getBackgroundImage() {
    return await this.getItem("background-image");
  }

  static async getImages() {
    return await this.getItem("images") || [];
  }

  static async setImages(images) {
    return await this.setItem("images", images);
  }

  static async addImage(image) {
    const images = await this.getImages();
    images.push(image);
    return await this.setImages(images);
  }

  static async getPostIts() {
    return await this.getItem("post-its") || [];
  }

  static async setPostIts(postIts) {
    return await this.setItem("post-its", postIts);
  }

  static async getPos(id) {
    return await this.getItem(`mainPos${id}`);
  }

  static async setPos(id, mainPos) {
    return await this.setItem(`mainPos${id}`, mainPos);
  }

  static async getState() {
    return await this.getItem(`state`);
  }

  static setState(state) {
    this.setItem(`state`, state);
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
    storage.set({
      [mainKey + key]: data,
    });
  }
}
