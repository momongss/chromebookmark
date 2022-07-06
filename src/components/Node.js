import { nodeList } from "./NodeList.js";

export default class Node {
  constructor({ bookMark }) {
    nodeList.push(this);

    this.$node = null;
    this.isSelected = false;
  }

  select() {
    this.isSelected = true;
    this.$node.classList.add("selected");
  }

  deselect() {
    this.isSelected = false;
    this.$node.classList.remove("selected");    
  }
}