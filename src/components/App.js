import FolderManager from "./FolderManager.js";
import SearchBar from "./Search/SearchBar.js";
import RectDragger from "../utils/rectangleDrag.js";
import Wallpaper from "./Wallpaper/Wallpaper.js";
import ImageManager from "./Image/ImageManager.js";
import PostItManager from "./PostIt/PostItManager.js";

import OptionCreate from "./Options/OptionCreate.js";

import Storage from "../utils/storage.js";

import { constDatas } from "../utils/const.js";
import { findNearbyEmptyWrapperAround, isWrapperOccupied, parseWrapperCoords } from "../utils/utils.js";
import DropHandlerApp from "../utils/dropHandlerApp.js";

import FileNode from "./File/File.js";
import FolderNode from "./Folder/Folder.js";

export default class App {
  static $dom;

  constructor({ $app }) {
    this.$dom = this;
    this._constructor($app);
  }

  async _constructor($app) {
    // https://wallpaperaccess.com/aesthetic-gif

    const rootTree = await this.getBookMarkList();
    const bookMarkTree = rootTree.children;
    this.rootId = rootTree.id;
    constDatas.rootId = this.rootId;

    this.history = [];

    this.$app = $app;
    this.$wallpaper = new Wallpaper();
    this.$imageManager = new ImageManager($app);
    this.$postItManager = new PostItManager($app);
    
    // 포스트잇 매니저를 전역으로 설정
    window.postItManager = this.$postItManager;

    // Load user grid/tile settings or defaults
    this.settings = (await Storage.getUserSettings()) || {
      tileW: 75,  // px
      tileH: 80,  // px
      gap: 12     // px
    };

    // Apply CSS variables and compute grid size
  this.applyGridStyle($app, this.settings);

    const state = await Storage.getState();

    state
      ? this.renderRunned(bookMarkTree, $app)
      : this.renderMainInit(bookMarkTree, $app);

    const dragger = document.createElement("rect-dragger");
    $app.appendChild(dragger);
    dragger.Init($app);

    this.eventListeners();
    this.initGlobalClickHandler($app);

    this.dropHandlerApp = new DropHandlerApp($app);

    // React to resize to keep grid responsive
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);

    // 검색바 초기화 및 단축키 바인딩 (Ctrl+F)
    this.searchBar = new SearchBar(this);
    window.searchBar = this.searchBar; // optional global
    document.addEventListener('keydown', (e) => {
      // 입력 중 Ctrl+F도 허용: 기본 찾기 방지 후 검색바 표시
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        this.searchBar.show();
      }
      if (e.key === 'Escape' && this.searchBar?.isOpen()) {
        e.stopPropagation();
        this.searchBar.hide();
      }
    });

    // 우측 상단 고정 툴바 (검색, 포스트잇 생성)
    this._createRightToolbar();
  }

  _createRightToolbar() {
    const $bar = document.createElement('div');
    $bar.className = 'right-toolbar';
    $bar.style.cssText = [
      'position:fixed',
      'top:12px',
      'right:12px',
      'display:flex',
      'flex-direction:column',
      'gap:8px',
      'z-index:11000',
      'align-items:flex-end'
    ].join(';');

    const mkBtn = (label, title) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.title = title;
      btn.style.cssText = [
        'width:36px','height:36px',
        'border-radius:999px',
        // Glassmorphism base
        'border:1px solid rgba(255,255,255,0.28)',
        'background: rgba(255,255,255,0.12)',
        '-webkit-backdrop-filter: blur(8px) saturate(140%)',
        'backdrop-filter: blur(8px) saturate(140%)',
        'box-shadow: 0 6px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)',
  'cursor:pointer',
  'font-size:16px',
        'display:flex','align-items:center','justify-content:center',
        'transition:transform 0.1s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease'
      ].join(';');
      btn.addEventListener('mouseenter', () => {
        btn.style.boxShadow = '0 10px 22px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)';
        btn.style.background = 'rgba(255,255,255,0.18)';
        btn.style.borderColor = 'rgba(255,255,255,0.38)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.25)';
        btn.style.background = 'rgba(255,255,255,0.12)';
        btn.style.borderColor = 'rgba(255,255,255,0.28)';
      });
      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'scale(0.96)';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.2)';
        btn.style.background = 'rgba(255,255,255,0.16)';
      });
      btn.addEventListener('mouseup', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = '0 10px 22px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)';
        btn.style.background = 'rgba(255,255,255,0.18)';
      });
      return btn;
    };

    const $searchBtn = mkBtn('🔎', '검색 열기/닫기 (Ctrl+F)');
    $searchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.searchBar) return;
      if (this.searchBar.isOpen()) this.searchBar.hide();
      else this.searchBar.show();
    });

    const $noteBtn = mkBtn('', '포스트잇 생성');
    // 아이콘: assets/postiit-icon.svg
    $noteBtn.innerHTML = '<img src="assets/postit-icon.svg" alt="포스트잇 생성" style="width:18px;height:18px;display:block;pointer-events:none;" />';
    $noteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // 버튼 아래, 오른쪽 벽에서 약간 떨어진 위치에 생성
      const x = Math.max(16, window.innerWidth - 240);
      const y = 70; // 상단에 겹치지 않게
      if (window.postItManager?.createPostIt) {
        window.postItManager.createPostIt(x, y);
      }
    });

    $bar.appendChild($searchBtn);
    $bar.appendChild($noteBtn);
    document.body.appendChild($bar);
  }

  applyGridStyle($app, settings) {
    // Set CSS variables for tile size and grid gap
    $app.style.setProperty('--grid-item-width', `${settings.tileW}px`);
    $app.style.setProperty('--grid-item-height', `${settings.tileH}px`);
    // 북마크 그리드 spacing 제거 요구사항에 따라 gap은 항상 0 처리
    $app.style.gap = '0px';

    // Compute columns/rows from available space
    const { cols, rows } = this.computeGridDims($app, settings);
    this.gridCols = cols;
    this.gridRows = rows;

    // Override grid template to dynamic values
    $app.style.gridTemplateColumns = `repeat(${cols}, var(--grid-item-width))`;
    $app.style.gridTemplateRows = `repeat(${rows}, var(--grid-item-height))`;

    // Ensure wrappers up to current grid exist
    this.ensureGridWrappers(cols, rows);
  }

  computeGridDims($app, settings) {
    // Use viewport size to avoid 0-size before grid is populated
    const aw = Math.max(0, window.innerWidth || 0);
    const ah = Math.max(0, window.innerHeight || 0);
    const stepX = settings.tileW; // gap 제거
    const stepY = settings.tileH; // gap 제거
    const cols = Math.max(3, Math.floor(aw / stepX));
    const rows = Math.max(3, Math.floor(ah / stepY));
    return { cols, rows };
  }

  onResize() {
    // Recompute and, if changed, expand wrappers; do not remove or reflow
    const prevCols = this.gridCols;
    const prevRows = this.gridRows;
    const { cols, rows } = this.computeGridDims(this.$app, this.settings);
    if (cols === prevCols && rows === prevRows) return;
    this.gridCols = cols;
    this.gridRows = rows;
  this.$app.style.gridTemplateColumns = `repeat(${cols}, var(--grid-item-width))`;
  this.$app.style.gridTemplateRows = `repeat(${rows}, var(--grid-item-height))`;
  this.$app.style.gap = '0px';
    this.ensureGridWrappers(cols, rows);
  }

  ensureGridWrappers(cols, rows) {
    const $app = this.$app;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!$app.querySelector(`.node-wrapper-${x}-${y}`)) {
          const $div = document.createElement('div');
          $div.className = `node-wrapper-${x}-${y}`;
          $app.appendChild($div);
        }
      }
    }
  }

  ensureWrapperExists(x, y) {
    const sel = `.node-wrapper-${x}-${y}`;
    let w = this.$app.querySelector(sel);
    if (!w) {
      w = document.createElement('div');
      w.className = `node-wrapper-${x}-${y}`;
      this.$app.appendChild(w);
    }
    return w;
  }

  // Wrapper utilities moved to utils.js

  eventListeners() {
    document.addEventListener("click", async (e) => {
      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });
      document.querySelectorAll(".post-it-context-menu").forEach(($el) => {
        $el.remove();
      });
    });

    this.$app.addEventListener("contextmenu", (e) => {
      e.preventDefault();

      if (this.$nodeOptions) this.$nodeOptions.remove();
      if (this.$createOptions) this.$createOptions.remove();

      document.querySelectorAll(".options").forEach(($el) => {
        $el.remove();
      });
      document.querySelectorAll(".post-it-context-menu").forEach(($el) => {
        $el.remove();
      });

      if (e.target.className.includes("node-wrapper")) {
        const optionCreate = new OptionCreate({
          $app: this.$app,
          $target: e.target,
          x: e.clientX,
          y: e.clientY,
          mode: "app",
        });
        this.$createOptions = optionCreate.$createOptions;
      }
    });

    // Add drop event listener
    this.$app.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.$app.addEventListener('drop', async (e) => {
      e.preventDefault();
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const image = {
              src: event.target.result,
              x: e.clientX - this.$app.getBoundingClientRect().left,
              y: e.clientY - this.$app.getBoundingClientRect().top,
              width: 200,
              height: 200
            };
            await Storage.addImage(image);
            this.createImageElement(image);
          };
          reader.readAsDataURL(file);
        }
      }
    });

    this.$app.addEventListener("pointerdown", (e) => {
      // 바탕화면에서만 동작: 노드, 폴더매니저, rect-dragger가 아닌 곳만
      const tag = e.target.tagName.toLowerCase();
      const isNode = tag.includes('node');
      const isManager = tag.includes('folder-manager');
      const isDragger = tag.includes('rect-dragger');
      if (!isNode && !isManager && !isDragger) {
        document.querySelectorAll('.multi').forEach(el => {
          el.classList.remove('multi');
          if (el.firstElementChild) el.firstElementChild.classList.remove('selected');
        });
      }
    });
  }

  async renderRunned(bookMarkTree, $app) {
    const lenX = this.gridCols || 20;
    const lenY = this.gridRows || 9;

    const posUndefineds = [];

    for (let y = 0; y < lenY; y++) {
      for (let x = 0; x < lenX; x++) {
        const $div = document.createElement("div");
        $div.className = `node-wrapper-${x}-${y}`;
        $app.appendChild($div);
      }
    }

    for (const bookMark of bookMarkTree) {
      const pos = await Storage.getPos(bookMark.id);
      if (pos == null) {
        posUndefineds.push(bookMark);
        continue;
      }
      else {
        let targetWrapper = this.ensureWrapperExists(pos.x, pos.y);
        // Avoid double-placement: if occupied, use nearest empty wrapper
        if (isWrapperOccupied(targetWrapper)) {
          const alt = findNearbyEmptyWrapperAround(this.$app, pos.x, pos.y, { maxCols: this.gridCols, maxRows: this.gridRows });
          if (alt) {
            targetWrapper = alt;
            const altPos = parseWrapperCoords(alt);
            if (altPos) {
              // Persist resolved placement
              Storage.setPos(bookMark.id, { x: altPos.x, y: altPos.y });
            }
          }
        }
        if (bookMark.children == null) {
          const fileNode = new FileNode();
          fileNode.Init({
            $parent: targetWrapper,
            bookMark: bookMark,
          });
          const finalPos = parseWrapperCoords(targetWrapper) || pos;
          fileNode.savedPos = { x: finalPos.x, y: finalPos.y };
        } else {
          const folderNode = new FolderNode();
          folderNode.Init({
            $parent: targetWrapper,
            bookMark: bookMark,
          });
          const finalPos = parseWrapperCoords(targetWrapper) || pos;
          folderNode.savedPos = { x: finalPos.x, y: finalPos.y };
        }
      }
    }

    for (const bookMark of posUndefineds) {
      if (bookMark.children == null) {
        const $wrapper = findEmpty($app);
        const tmp = $wrapper.className.split("-");
        const pos = {
          x: tmp[2],
          y: tmp[3],
        };
        const fileNode = new FileNode();
        fileNode.Init({
          $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
          bookMark: bookMark,
        });

        Storage.setPos(bookMark.id, pos);
      } else {
        const $wrapper = findEmpty($app);
        const tmp = $wrapper.className.split("-");
        const pos = {
          x: tmp[2],
          y: tmp[3],
        };
        const folderNode = new FolderNode();
        folderNode.Init({
          $parent: $app.querySelector(`.node-wrapper-${pos.x}-${pos.y}`),
          bookMark: bookMark,
        });
        Storage.setPos(bookMark.id, pos);
      }
    }
  }

  renderMainInit(bookMarkTree, $app) {
  const lenX = this.gridCols || 20;
  const lenY = this.gridRows || 9;

    let zIndex = 1000;
    for (let y = 0; y < lenY; y++) {
      for (let x = 0; x < lenX; x++) {
        const w = this.ensureWrapperExists(x, y);
        w.style.zIndex = zIndex;
        zIndex -= 1;
      }
    }

    const fileInitX = 9;
    const fileEndX = 15;
    const folderInitX = 4;
    const folderEndX = 8;

    const filePos = { x: fileInitX, y: 1 };
    const folderPos = { x: folderInitX, y: 1 };

    let fileCnt = 0;
    let folderCnt = 0;
    for (const bookMark of bookMarkTree) {
      if (bookMark.children == null) fileCnt++;
      else folderCnt++;
    }

    for (const bookMark of bookMarkTree) {
      // children 이 null 이면 파일(북마크).
      if (bookMark.children == null) {
        // 정리된 형태로 들어갈 자리가 없으면 빈자리 아무데나 들어간다.
        if (filePos.y >= lenY) {
          const $wrapper = findEmpty($app);
          const tmp = $wrapper.className.split("-");
          filePos.x = parseInt(tmp[2]);
          filePos.y = parseInt(tmp[3]);
        }
        // Ensure no duplicate in initial layout
        let target = this.$app.querySelector(`.node-wrapper-${filePos.x}-${filePos.y}`);
        if (isWrapperOccupied(target)) {
          const alt = findNearbyEmptyWrapperAround(this.$app, filePos.x, filePos.y, { maxCols: this.gridCols, maxRows: this.gridRows });
          if (alt) {
            const altPos = parseWrapperCoords(alt);
            if (altPos) {
              filePos.x = altPos.x; filePos.y = altPos.y;
            }
          }
        }
        Storage.setPos(bookMark.id, filePos);

        const fileNode = new FileNode();
        fileNode.Init({
          $parent: this.ensureWrapperExists(filePos.x, filePos.y),
          bookMark: bookMark,
        });

        filePos.x++;
        if (filePos.x >= fileEndX) {
          filePos.x = fileInitX;
          filePos.y++;
        }
      }

      // children 이 있으면 폴더.
      else {
        if (folderPos.y >= lenY) {
          const $wrapper = findEmpty($app);
          const tmp = $wrapper.className.split("-");
          folderPos.x = parseInt(tmp[2]);
          folderPos.y = parseInt(tmp[3]);
        }
        // Ensure no duplicate in initial layout
        let targetF = this.$app.querySelector(`.node-wrapper-${folderPos.x}-${folderPos.y}`);
        if (isWrapperOccupied(targetF)) {
          const altF = findNearbyEmptyWrapperAround(this.$app, folderPos.x, folderPos.y, { maxCols: this.gridCols, maxRows: this.gridRows });
          if (altF) {
            const altPosF = parseWrapperCoords(altF);
            if (altPosF) {
              folderPos.x = altPosF.x; folderPos.y = altPosF.y;
            }
          }
        }
        Storage.setPos(bookMark.id, folderPos);

        const folderNode = new FolderNode();
        folderNode.Init({
          $parent: this.ensureWrapperExists(folderPos.x, folderPos.y),
          bookMark: bookMark,
        });

        folderPos.x++;
        if (folderPos.x >= folderEndX) {
          folderPos.x = folderInitX;
          folderPos.y++;
        }
      }
    }

    Storage.setState("runned");
  }

  // 전역 클릭 이벤트로 선택 상태 초기화
  initGlobalClickHandler($app) {
    // Escape 키로 멀티 선택 해제
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const hasMultiSelection = document.querySelectorAll('.multi').length > 0;
        if (hasMultiSelection) {
          console.log('Escape 키 - 멀티 선택 상태 해제');

          const rectDragger = document.querySelector('rect-dragger');
          rectDragger.clearAllSelections();
        }
      }
    });
  }

  getBookMarkList() {
    const bookMark = new Promise((resolve) => {
      chrome.bookmarks.getTree(resolve);
    });

    return bookMark.then((itemTree) => {
      return itemTree[0].children[0];
    });
  }
}

function findEmpty($app) {
  for (const $child of $app.childNodes) {
    if (
      $child.className.includes("node-wrapper") &&
      $child.childElementCount === 0
    ) {
      return $child;
    }
  }
}
