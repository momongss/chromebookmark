import OptionCreate from "./Options/OptionCreate.js";

import Bookmark from "../utils/bookmark.js";

import { FolderManagerData } from "../utils/FolderManagerData.js";
import App from "./App.js";
import bookmarkManager from "../utils/bookmark.js";

export default class FolderManager extends HTMLElement {
  Init({ id, initPos, onDestroy }) {
    this.className = `folder-manager-wrapper`;

    FolderManagerData.zindex++;
    this.style.zIndex = FolderManagerData.zindex;
    FolderManagerData.$prevManager = this;

    this.addEventListener("mousedown", (e) => {
      if (FolderManagerData.$prevManager === this) return;
      FolderManagerData.zindex++;
      this.style.zIndex = FolderManagerData.zindex;
      FolderManagerData.$prevManager = this;
    });

    document.body.appendChild(this);

    this.$app = App.$dom;

    this.history = [];
    this.nodeCount = 0;

    this.pos = {
      left: initPos.left < 393 ? 0 : initPos.left - 393,
      top: initPos.top,
    };

    this.onDestroy = onDestroy;

    this.id = id;

    this.render({
      id: id,
    });
  }

  addItem(node) {
    // 북마크 이동을 먼저 수행
    bookmarkManager.moveTree(node.id, this.id);
    
    // 현재 드래그 중인 요소가 있는지 확인
    const draggingElement = document.querySelector('.node[style*="position: fixed"]');
    if (draggingElement) {
      // 드래그가 완료될 때까지 render 지연
      requestAnimationFrame(() => {
        this.render({ id: this.id, mode: "back" });
      });
    } else {
      // 일반적인 경우 즉시 처리
      this.render({ id: this.id, mode: "back" });
    }
  }

  rightClickHandler() {
    document.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();
    });

    this.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    this.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();
      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });
    });

    this.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();

      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });

      if (e.target.className === "folder-manager") {
        const optionCreate = new OptionCreate({
          $app: this.$app,
          $target: e.target,
          x: e.clientX,
          y: e.clientY,
        });
        this.$createOptions = optionCreate.$createOptions;
      }
    });
  }

  dragListener($header) {
    let dragged = false;
    let initX, initY;
    let folderX, folderY;

    $header.addEventListener("pointerdown", (e) => {
      if (e.target.className === "folder-close") return;
      dragged = true;
      initX = e.clientX;
      initY = e.clientY;

      folderX = parseInt(this.style.left.slice(0, this.style.left.length - 2));

      folderY = parseInt(this.style.top.slice(0, this.style.top.length - 2));
    });

    let left;
    let top;

    document.addEventListener("pointermove", (e) => {
      if (dragged) {
        left = folderX + e.clientX - initX;
        top = folderY + e.clientY - initY;

        this.style.left = `${left}px`;
        this.style.top = `${top}px`;
      }
    });

    $header.addEventListener("pointerup", (e) => {
      dragged = false;

      this.pos.left = left;
      this.pos.top = top;

      console.log(this.dragger);
      this.dragger.Init(this.$folderManager, {
        x: this.pos.left + 2,
        y: this.pos.top + $header.offsetHeight,
      });
    });
  }

  async render({ id, mode }) {
    this.id = id;
    const subTree = await Bookmark.getSubTree(id);
    const title = subTree[0].title;
    const bookMarkTree = subTree[0].children;
    if (mode !== "back") {
      this.history.push({
        id: id,
      });
    }
    this.innerHTML = "";
    this.classList.add("show");
    this.style.top = `${this.pos.top}px`;
    this.style.left = `${this.pos.left}px`;

    // --- 정렬/배치 UI 추가 ---
    const $controls = document.createElement("div");
    $controls.className = "folder-manager-controls";
    $controls.style.display = "flex";
    $controls.style.gap = "8px";
    $controls.style.alignItems = "center";
    $controls.style.margin = "0 0 8px 0";
    $controls.style.padding = "6px 12px";
    $controls.style.background = "#f7f8fa";
    $controls.style.borderBottom = "1px solid #e0e0e0";
    $controls.style.boxShadow = "0 1px 4px 0 rgba(0,0,0,0.03)";
    $controls.style.borderRadius = "0 0 10px 10px";

    // 정렬 기준 드롭다운
    const $sortSelect = document.createElement("select");
    $sortSelect.innerHTML = `
      <option value="recent">최근순</option>
      <option value="name">이름순</option>
      <option value="custom">사용자 지정순</option>
    `;
    $sortSelect.value = window.folderManagerSortType || "recent";
    $sortSelect.style.padding = "4px 10px";
    $sortSelect.style.borderRadius = "6px";
    $sortSelect.style.border = "1px solid #bfc7d1";
    $sortSelect.style.background = "#fff";
    $sortSelect.style.fontSize = "14px";
    $sortSelect.style.color = "#222";
    $sortSelect.style.boxShadow = "0 1px 2px 0 rgba(0,0,0,0.03)";
    $sortSelect.style.outline = "none";
    $controls.appendChild($sortSelect);

    // --- 기존 헤더/매니저 UI ---
    const $header = document.createElement("div");
    $header.className = "folder-manager-header";
    $header.style.display = "flex";
    $header.style.alignItems = "center";
    $header.style.justifyContent = "space-between";
    $header.style.background = "#e9eef6";
    $header.style.borderTopLeftRadius = "12px";
    $header.style.borderTopRightRadius = "12px";
    $header.style.padding = "0px";
    $header.style.boxShadow = "0 2px 8px 0 rgba(0,0,0,0.04)";
    $header.style.fontWeight = "bold";
    $header.style.fontSize = "16px";
    $header.style.letterSpacing = "0.5px";
    $header.style.borderBottom = "1.5px solid #dbe3ee";

    const $title = document.createElement("div");
    $title.className = "folder-title";
    $title.textContent = title;
    $title.style.flex = "1";
    $title.style.overflow = "hidden";
    $title.style.textOverflow = "ellipsis";
    $title.style.whiteSpace = "nowrap";
    $title.style.fontWeight = "bold";
    $title.style.fontSize = "16px";
    $header.appendChild($title);

    const $closeBtn = document.createElement("div");
    $closeBtn.className = "folder-close";
    $closeBtn.textContent = "×";
    $closeBtn.style.fontSize = "18px";
    $closeBtn.style.cursor = "pointer";
    $closeBtn.style.marginLeft = "12px";
    $closeBtn.style.color = "#888";
    $closeBtn.style.transition = "color 0.2s";
    // $closeBtn.addEventListener("mouseenter", () => $closeBtn.style.color = "#d32f2f");
    // $closeBtn.addEventListener("mouseleave", () => $closeBtn.style.color = "#888");
    $header.appendChild($closeBtn);

    this.appendChild($header);
    this.appendChild($controls);
    this.dragListener($header);

    const $folderManager = document.createElement("div");
    this.$folderManager = $folderManager;
    $folderManager.className = `folder-manager`;
    $folderManager.dataset.id = this.id;

    this.appendChild($folderManager);

    // 정렬/배치 상태 저장 및 이벤트
    $sortSelect.addEventListener("change", (e) => {
      window.folderManagerSortType = $sortSelect.value;
      this.render({ id: this.id, mode: "back" });
    });

    // --- 정렬/배치 로직 적용 ---
    let folderBookMark = [];
    let fileBookMark = [];
    for (const bookMark of bookMarkTree) {
      if (bookMark.children != null) {
        folderBookMark.push(bookMark);
      } else {
        fileBookMark.push(bookMark);
      }
    }
    // 정렬 기준 적용
    const sortType = window.folderManagerSortType || "recent";
    if (sortType === "recent") {
      folderBookMark.sort((a, b) => b.dateGroupModified - a.dateGroupModified);
      fileBookMark.sort((a, b) => b.dateAdded - a.dateAdded);
    } else if (sortType === "name") {
      folderBookMark.sort((a, b) => a.title.localeCompare(b.title));
      fileBookMark.sort((a, b) => a.title.localeCompare(b.title));
    } // 사용자 지정순은 추후 구현
    // 배치 방식 적용
    const layoutType = window.folderManagerLayoutType || "grid";
    if (layoutType === "list") {
      this.$folderManager.style.display = "block";
      this.$folderManager.style.gridTemplateRows = "";
    } else {
      const HEIGHT = 5;
      let ROW = Math.max(parseInt(bookMarkTree.length / HEIGHT) + 2, 5);
      this.$folderManager.style.display = "grid";
      this.$folderManager.style.gridTemplateRows = `5rem `.repeat(ROW).trim();
    }

    for (const bookMark of folderBookMark) {
      this.addFolder($folderManager, bookMark);
    }

    for (const bookMark of fileBookMark) {
      this.addFile($folderManager, bookMark);
    }

    this.rightClickHandler();

    // 폴더 매니저 전체 스타일 개선
    this.style.background = "#f4f7fb";
    this.style.borderRadius = "16px";
    this.style.boxShadow = "0 8px 32px 0 rgba(60,80,120,0.13)";
    this.style.border = "1.5px solid #dbe3ee";
    this.style.overflow = "hidden";

    this.dragger = document.createElement("rect-dragger");
    $folderManager.appendChild(this.dragger);
    // anchor는 폴더매니저의 화면상 위치 + header 높이로 복구
    const rect = $folderManager.getBoundingClientRect();
    console.log(rect.x, rect.y);
    this.dragger.Init($folderManager, {
      x: rect.x,
      y: rect.y,
    });

    $closeBtn.addEventListener("click", (e) => {
      this.remove();
      this.history = [];
      this.onDestroy();
    });
  }

  addFolder($folderManager, bookMark) {
    const folderNode = document.createElement("folder-node");
    folderNode.Init({
      $parent: $folderManager,
      bookMark: bookMark,
      isRoot: false,
      folderManager: this,
    });
    folderNode.parentFolderManager = this;

    this.nodeCount++;
  }

  addFile($folderManager, bookMark) {
    const fileNode = document.createElement("file-node");
    fileNode.Init_Manage({
      $parent: $folderManager,
      bookMark: bookMark,
    });
    fileNode.parentFolderManager = this;

    this.nodeCount++;
  }
}

customElements.define("folder-manager", FolderManager);
