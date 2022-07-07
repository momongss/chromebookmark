import { nodeList } from "../components/NodeList.js";

export default class DragSelectManager {
    constructor() {
        this.selectedObjs = [];
        this.initX = 0;
        this.initY = 0;

        this.isDragging = false;

        this.$div = document.createElement("div");
        this.$div.className = "drag-select-box";
        document.body.appendChild(this.$div);

        this.eventListener();
    }

    eventListener() {
        document.addEventListener("mousedown", (e) => {
            if (e.target.className.includes("node-wrapper") || e.target.className == "folder-manager") {
                this.startDragSelect(e.clientX, e.clientY);
            }
        });

        document.addEventListener("mouseup", (e) => {
            this.endDrag();
        });

        document.addEventListener("mousemove", (e) => {
            if (this.isDragging) {
                this.dragging(e.clientX, e.clientY);
            }
        })
    }

    startDragSelect(x, y) {
        this.$div.style.visibility = "visible";
        this.initX = x;
        this.initY = y;
        this.isDragging = true;

        for (let i = 0; i < this.selectedObjs.length; i++) {
            const node = this.selectedObjs[i];
            
            node.deselect();
        }

        this.selectedObjs = [];
    }

    endDrag() {
        this.isDragging = false;
        this.$div.style.visibility = "hidden";
        this.$div.style.left = `${window.innerWidth}px`;
        this.$div.style.right = `0px`;
        this.$div.style.top = `${window.innerHeight}px`;
        this.$div.style.bottom = `0px`;

        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i];
            
            if (node.isSelected) {
                this.selectedObjs.push(node);
            }
        }
    }

    search(sx, sy, bx, by) {
        for (let i = 0; i < nodeList.length; i++) {
            const node = nodeList[i];
            
            const rect = node.$node.getBoundingClientRect();
            const y = (rect.top + rect.bottom) / 2;
            const x = (rect.right + rect.left) / 2;

            if (sx <= x && x <= bx && sy <= y && y <= by) {
                node.select();
            } else {
                node.deselect();
            }
        }
    }

    dragging(x, y) {
        let sx, sy, bx, by;

        if (x > this.initX) {
            this.$div.style.left = `${this.initX}px`;
            this.$div.style.right = `${window.innerWidth - x}px`;

            sx = this.initX;
            bx = x;
        } else {
            this.$div.style.left = `${x}px`;
            this.$div.style.right = `${window.innerWidth - this.initX}px`;
            sx = x;
            bx = this.initX;
        }

        if (y > this.initY) {
            this.$div.style.top = `${this.initY}px`;
            this.$div.style.bottom = `${window.innerHeight - y}px`;

            sy = this.initY;
            by = y;
        } else { 
            this.$div.style.top = `${y}px`;
            this.$div.style.bottom = `${window.innerHeight - this.initY}px`;

            sy = y;
            by = this.initY;
        }

        this.search(sx, sy, bx, by);
    }
}