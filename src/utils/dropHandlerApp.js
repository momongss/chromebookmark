import Storage from "./storage.js";
import Bookmark from "./bookmark.js";

export default class DropHandlerApp {
    $parent;

    constructor($app) {
        this.$parent = $app;

        this.eventListeners();
    }

    eventListeners() {
        this.$parent.addEventListener("drop", this.onDrop);
        document.addEventListener("dragover", this.onDragOver);
        this.$parent.addEventListener("dragstart", this.onDragStart);
        this.$parent.addEventListener("drag", this.onDrag);
    }

    onDragStart = (e) => {
        // 드래그 시작 시 드래그된 객체 정보를 저장
        const draggedElement = e.target.closest('item-node, file-node, folder-node');
        if (draggedElement) {
            // dataTransfer에 드래그된 요소의 정보 저장
            e.dataTransfer.setData("text/plain", draggedElement.bookMark?.id || "");
            // 전역 변수로도 저장 (더 많은 정보 접근 가능)
            window.currentDraggedElement = draggedElement;
            
            // FolderManager 내에서 드래그가 발생한 경우 이벤트 전파 막기
            if (this.$parent.tagName === "FOLDER-MANAGER") {
                e.stopPropagation();
            }
        }
    }

    curHoverObj = null;

    onDragOver = (e) => {
        e.preventDefault(); // 드롭을 허용하기 위해 필요

        const folderNode = e.target.closest('folder-node');
        console.log(folderNode);

        if (e.target.className.includes("node-wrapper")) {
            e.target.classList.add("hover");
            if (this.curHoverObj && this.curHoverObj != e.target) {
                this.curHoverObj.classList.remove("hover");
            }

            this.curHoverObj = e.target;
        } else if (folderNode) {
            folderNode.classList.add("hover");
            if (this.curHoverObj && this.curHoverObj != folderNode) {
                this.curHoverObj.classList.remove("hover");
            }

            this.curHoverObj = folderNode;
        } else {
            if (this.curHoverObj) {
                this.curHoverObj.classList.remove("hover");
                this.curHoverObj = null;
            }
        }
    }

    onDrop = (e) => {
        e.preventDefault();
        
        // FolderManager 내에서 drop이 발생한 경우 이벤트 전파 막기
        if (this.$parent.tagName === "FOLDER-MANAGER") {
            e.stopPropagation();
        }

        if (this.curHoverObj) {
            this.curHoverObj.classList.remove("hover");
            this.curHoverObj = null;
        }
        
        // 드롭된 위치에서 상위로 탐색하여 해당하는 요소들 찾기
        const nodeWrapper = e.target.className.includes("node-wrapper") ? e.target : null;
        const folderNode = e.target.closest('folder-node');
        const folderManager = e.target.closest('folder-manager');
            
        // 드래그된 객체 (방법 2: 전역 변수 사용)
        const draggedElement = window.currentDraggedElement;

        // console.log("=== 드롭 이벤트 ===");
        console.log("드롭된 위치:", e.target);
        console.log("찾은 nodeWrapper:", nodeWrapper);
        console.log("찾은 folderNode:", folderNode);
        console.log("찾은 folderManager:", folderManager);
        // console.log("드래그된 객체 ID:", draggedId);
        console.log("드래그된 객체:", draggedElement);
        // console.log("드래그된 객체의 북마크:", draggedElement?.bookMark);

        if (nodeWrapper) {
            const pos = nodeWrapper.className.split("-");
            const x = pos[2];
            const y = pos[3];

            // Storage.setPos(draggedElement.bookMark.id, { x, y });

            draggedElement.ReInit({ $parent: nodeWrapper });
        } else if (folderNode && folderNode != draggedElement) {
            console.log(`폴더 노드에 드롭됨: ${folderNode.tagName}`);
            folderNode.addItem(draggedElement.bookMark);
            draggedElement.remove();
        } else if (folderManager) {
            console.log(`폴더 매니저에 드롭됨: ${folderManager.tagName}`);
            folderManager.addItem(draggedElement.bookMark);
            draggedElement.remove();
        }
        else {
            console.log(`다른 곳에 드롭됨`);
        }

        // 정리
        window.currentDraggedElement = null;
    }
}
