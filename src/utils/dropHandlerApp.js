import Storage from "./storage.js";
import Bookmark from "./bookmark.js";

export default class DropHandlerApp {
    $app;

    constructor($app) {
        this.$app = $app;

        this.eventListeners();
    }

    eventListeners() {
        this.$app.addEventListener("drop", this.onDrop);
        this.$app.addEventListener("dragover", this.onDragOver);
        this.$app.addEventListener("dragstart", this.onDragStart);
    }

    onDragStart = (e) => {
        // 드래그 시작 시 드래그된 객체 정보를 저장
        const draggedElement = e.target.closest('item-node, file-node, folder-node');
        if (draggedElement) {
            // dataTransfer에 드래그된 요소의 정보 저장
            e.dataTransfer.setData("text/plain", draggedElement.bookMark?.id || "");
            // 전역 변수로도 저장 (더 많은 정보 접근 가능)
            window.currentDraggedElement = draggedElement;
        }
    }

    onDragOver = (e) => {
        e.preventDefault(); // 드롭을 허용하기 위해 필요
    }

    onDrop = (e) => {
        e.preventDefault();
        
        // 드롭된 위치의 객체
        const dropTarget = e.target;
        
        // 드래그된 객체 (방법 1: dataTransfer 사용)
        const draggedId = e.dataTransfer.getData("text/plain");
        
        // 드래그된 객체 (방법 2: 전역 변수 사용)
        const draggedElement = window.currentDraggedElement;

        // console.log("=== 드롭 이벤트 ===");
        // console.log("드롭된 위치:", dropTarget);
        // console.log("드래그된 객체 ID:", draggedId);
        // console.log("드래그된 객체:", draggedElement);
        // console.log("드래그된 객체의 북마크:", draggedElement?.bookMark);

        if (dropTarget.className.includes("node-wrapper")) {
            const pos = dropTarget.className.split("-");
            const x = pos[2];
            const y = pos[3];

            // Storage.setPos(draggedElement.bookMark.id, { x, y });

            draggedElement.ReInit({ $parent: dropTarget });
        } else {
            console.log("다른 곳에 드롭됨");
        }

        // 정리
        window.currentDraggedElement = null;
    }
}
