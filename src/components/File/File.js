import ItemNode from "../Node.js";
import OptionEdit from "../Options/OptionEdit.js";

export default class FileNode extends ItemNode {
  isRoot = false;

  Init(bookMark) {
    this.bookMark = bookMark;
    this.$node = document.createElement("a");
    this.$node.className = "node file";
    this.appendChild(this.$node);
    this.render();
    this.eventListeners();
  }

  Init_App({ $parent, bookMark }) {
    this.Init(bookMark);
    $parent.innerHTML = "";
    $parent.appendChild(this);

    this.isRoot = true;
  }

  Init_Manage({ $parent, bookMark }) {
    this.Init(bookMark);
    $parent.appendChild(this);

    this.isRoot = false;
  }

  getFaviconURL(u) {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", u);
    url.searchParams.set("size", "32");
    return url.toString();
  }

  render() {
    if (!this.bookMark) return;

    this.$node.href = this.bookMark.url;
    this.$node.dataset.id = this.bookMark.id;

    let faviconURL = this.getFaviconURL(this.bookMark.url);
    if (this.bookMark.url.includes("youtube.com")) {
      faviconURL = "../../assets/youtube.svg";
    }

    this.$node.innerHTML = `
      <div class="file-wrapper">
        <img src="${faviconURL}"/>
        <div class="text">${this.bookMark.title}</div>
      </div>
    `;
  }

  eventListeners() {
    document.addEventListener("click", () => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
    });

    // 클릭 이벤트에 드래그 체크 추가
    this.$node.addEventListener("click", (e) => {
      // 드래그가 끝난 직후라면 클릭 이벤트 무시
      if (this.dragEndTime && Date.now() - this.dragEndTime < 150) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // 원래 위치에서 드롭된 경우 클릭 허용
      if (this.originalPosition) {
        const currentPosition = {
          left: this.getBoundingClientRect().left,
          top: this.getBoundingClientRect().top
        };
        const originalDistance = this.calculateDistance(
          { x: this.originalPosition.left, y: this.originalPosition.top },
          { x: currentPosition.left, y: currentPosition.top }
        );
        
        // 원래 위치 근처로 돌아왔으면 클릭 허용
        if (originalDistance <= 10) {
          return;
        }
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
    });

    this.$node.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });

      this.optionEdit = new OptionEdit({
        $target: this.$node,
        x: e.clientX,
        y: e.clientY,
      });
      this.$nodeOptions = this.optionEdit.$nodeOptions;
    });
  }
}

customElements.define("file-node", FileNode);
