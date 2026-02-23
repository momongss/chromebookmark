import OptionCreate from "./Options/OptionCreate.js";

import Bookmark from "../utils/bookmark.js";

import { FolderManagerData } from "../utils/FolderManagerData.js";
import ZIndexManager from "../utils/ZIndexManager.js";
import App from "./App.js";
import bookmarkManager from "../utils/bookmark.js";
import DropHandlerApp from "../utils/dropHandlerApp.js";

export default class FolderManager extends HTMLElement {
  Init({ id, initPos, onDestroy }) {
    this.className = `folder-manager-wrapper`;

    // ZIndexManager를 통해 최상위 z-index 할당
    this.style.zIndex = ZIndexManager.getNextIndex();
    FolderManagerData.$prevManager = this;

    this.addEventListener("mousedown", (e) => {
      // 항상 최신 z-index 할당 (PostIt 등이 그 사이에 최상위가 되었을 수 있음)
      this.style.zIndex = ZIndexManager.getNextIndex();
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

    this.dropHandlerApp = new DropHandlerApp(this);

    // 포인터 이벤트가 바탕화면으로 전파되어 선택/드래그가 시작되는 문제 방지
    this._installStopPropagation();
  }

  addItem(node) {
    // 북마크 이동을 먼저 수행
    bookmarkManager.moveTree(node.id, this.id);

    this.render({ id: this.id, mode: "back" });
  }

  rightClickHandler() {
    document.addEventListener("click", (e) => {
      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();
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
      // 닫기 버튼(내부 img 포함)을 클릭한 경우 드래그 시작 방지
      if (e.target.closest('.folder-close')) return;
      dragged = true;
      initX = e.clientX;
      initY = e.clientY;

      folderX = parseInt(this.style.left.slice(0, this.style.left.length - 2));
      folderY = parseInt(this.style.top.slice(0, this.style.top.length - 2));

      // 드래그 시작 시 클래스 추가
      this.classList.add("dragging");

      e.stopPropagation();
    });

    this.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
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

      // 드래그 종료 시 클래스 제거
      this.classList.remove("dragging");

      const rect = this.$folderManager.getBoundingClientRect();
      this.dragger.Init(this.$folderManager, rect);
    });
  }

  async render({ id, mode }) {
    this.id = id;
    const subTree = await Bookmark.getSubTree(id);
    const title = subTree[0].title;
    const bookMarkTree = subTree[0].children;

    this.innerHTML = "";
    this.classList.add("show");
    this.style.top = `${this.pos.top}px`;
    this.style.left = `${this.pos.left}px`;

    // --- 정렬/배치 UI 추가 ---
    const $controls = document.createElement("div");
    $controls.className = "folder-manager-controls";

    // 정렬 기준 드롭다운
    const $sortSelect = document.createElement("select");
    $sortSelect.innerHTML = `
      <option value="recent">최근순</option>
      <option value="name">이름순</option>
      <option value="custom">사용자 지정순</option>
    `;
    $sortSelect.value = window.folderManagerSortType || "recent";
    $controls.appendChild($sortSelect);

    // --- 기존 헤더/매니저 UI ---
    const $header = document.createElement("div");
    $header.className = "folder-manager-header";

    // 항상 백 버튼 자리 확보(필요 없을 때는 숨김 처리로 공간 유지)
    const $backBtn = document.createElement("div");
    $backBtn.className = "back-btn";
    $backBtn.style.cursor = "pointer";
    $backBtn.style.marginRight = "8px";
    $backBtn.innerHTML = `<img src="assets/back-arrow.svg" alt="back"/>`;
    $header.appendChild($backBtn);

    const $title = document.createElement("div");
    $title.className = "folder-title";
    $title.textContent = title;
    $header.appendChild($title);

    const $closeBtn = document.createElement("div");
    $closeBtn.className = "folder-close";
    $closeBtn.innerHTML = `<img src="assets/close.svg" alt="close"/>`;
    // 접근성 및 클릭 영역 개선
    $closeBtn.setAttribute('role', 'button');
    $closeBtn.setAttribute('tabindex', '0');
    $header.appendChild($closeBtn);

    this.appendChild($header);
    this.appendChild($controls);
    this.dragListener($header);

    const $folderManager = document.createElement("div");
    this.$folderManager = $folderManager;
    $folderManager.className = `folder-manager`;
    $folderManager.dataset.id = this.id;

    this.appendChild($folderManager);

    // 내부 영역에서도 포인터 이벤트 전파 차단
    this._installStopPropagation($folderManager);

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

    this.dragger = document.createElement("rect-dragger");
    $folderManager.appendChild(this.dragger);
    // anchor는 폴더매니저의 화면상 위치 + header 높이로 복구
    const rect = $folderManager.getBoundingClientRect();
    this.dragger.Init($folderManager, rect);

    // 닫기 버튼 클릭(이미지 클릭 포함) 시 닫기, 드래그 방지
    const handleClose = (e) => {
      e.stopPropagation();
      this.remove();
      this.history = [];
      this.onDestroy();
      console.log("close");
    };
    $closeBtn.addEventListener("click", handleClose);
    const $closeImg = $closeBtn.querySelector('img');
    if ($closeImg) {
      $closeImg.addEventListener('click', handleClose);
      $closeImg.addEventListener('pointerdown', (e) => e.stopPropagation());
    }
    $closeBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    $closeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        handleClose(e);
      }
    });

    console.log(this.history);

    if (mode !== "back") {
      this.history.push({
        id: id,
      });
    }

    // 백 버튼 동작/표시 토글: history가 1보다 클 때만 보이고 동작함
    if (this.history.length > 1) {
      $backBtn.style.visibility = 'visible';
      $backBtn.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });
      $backBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("back");
        if (this.history.length > 1) {
          this.history.pop();
          const prev = this.history[this.history.length - 1];
          this.render({ id: prev.id, mode: "back" });
        }
      });
    } else {
      // 공간 유지용으로 숨김 처리
      $backBtn.style.visibility = 'hidden';
      $backBtn.style.pointerEvents = 'none';
    }
  }

  // 바탕화면(RectDragger/App)로 포인터 이벤트가 전파되지 않도록 캡처 단계에서 차단
  _installStopPropagation(target = this) {
    const stop = (e) => { e.stopPropagation(); };
    // 버블 단계에서만 전파 차단하여, 타깃/캡처 단계의 내부 핸들러(특히 헤더 드래그)가 정상 동작하도록 함
    ['pointerdown', 'mousedown', 'touchstart', 'dragstart'].forEach((type) => {
      target.addEventListener(type, stop, { capture: false });
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
    fileNode.Init({
      $parent: $folderManager,
      bookMark: bookMark,
      folderManager: this,
    });
    fileNode.parentFolderManager = this;

    this.nodeCount++;
  }
}

customElements.define("folder-manager", FolderManager);
