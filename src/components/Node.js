import { nodeList } from "./NodeList.js";
import { bfs } from "../utils/bfs.js";
import Storage from "../utils/storage.js";

const posDic = {};

export default class Node {
  constructor({ bookMark }) {
    nodeList.push(this);

    this.id = bookMark.id;
    this.$node = null;
    this.isSelected = false;

    this.init();
  }

  async init() {
    const pos = await this.loadPos();

    this.pos = {
      x: parseInt(pos.x),
      y: parseInt(pos.y),
    };
  }

  select() {
    this.isSelected = true;
    this.$node.classList.add("selected");
  }

  deselect() {
    this.isSelected = false;
    this.$node.classList.remove("selected");
  }

  move(posX, posY) {
    document.body.appendChild(this.$node);
    this.$node.style.position = "absolute";
    this.$node.style.top = `${posY}px`;
    this.$node.style.left = `${posX}px`;
  }

  async loadPos() {
    const pos = await Storage.getPos(this.id);
    posDic[this.id] = pos;
    return pos;
  }

  changePos(x, y) {
    const pos = this.getClosestPos(x, y);
    // posDic[this.id] = pos;

    Storage.setPos(this.id, pos);
  }

  getClosestPos(x, y) {
    const queue = [{ x, y }];
    const visited = [];

    const delta = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];

    while (queue.length > 0) {
      const pos = queue.shift();

      if (this.isPosExist(pos, visited)) continue;
      visited.push(pos);

      if (!this.isPosExist(pos, Object.values(posDic))) {
        return pos;
      }

      for (const dPos of delta) {
        queue.push({ x: pos.x + dPos[0], y: pos.y + dPos[1] });
      }
    }
  }

  isPosExist(pos, posList) {
    for (const prePos of posList) {
      if (pos.x == prePos.x && pos.y == prePos.y) {
        return true;
      }
    }

    return false;
  }
}
