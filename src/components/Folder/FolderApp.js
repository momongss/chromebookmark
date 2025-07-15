import Folder from "./Folder.js";

export default class FolderApp extends Folder {
  constructor({ $app, bookMark, pos, $target }) {
    super({
      bookMark: bookMark,
    });
    this.bookMark = bookMark;
    this.managerCnt = 0;

    if ($target == null) {
      const $div = $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`);
      $div.innerHTML = "";
      $div.appendChild(this.$node);
      this.$ = $div;
    } else {
      $target.appendChild(this.$node);
    }

    this.$node.addEventListener("click", (e) => {
      // 드래그가 끝난 직후라면 클릭 이벤트 무시
      if (this.dragEndTime && Date.now() - this.dragEndTime < 150) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // 드래그 거리가 충분한 경우 클릭 이벤트 무시
      if (this.startX !== null && this.startY !== null) {
        const distance = this.calculateDistance(
          { x: this.startX, y: this.startY },
          { x: e.clientX, y: e.clientY }
        );
        if (distance > 5) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }

      const $rect = this.$node.getBoundingClientRect();
      const initPos = {
        top: $rect.top + this.managerCnt * 35,
        left: $rect.x + this.managerCnt * 35,
      };
      this.managerCnt++;
      const folderManager = document.createElement("folder-manager");
      folderManager.Init({
        id: this.bookMark.id,
        initPos: initPos,
        onDestroy: () => {
          this.managerCnt--;
        },
      });
    });
  }
}
