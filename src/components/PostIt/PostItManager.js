import Storage from "../../utils/storage.js";
import ZIndexManager from "../../utils/ZIndexManager.js";

export default class PostItManager {
  constructor($app) {
    this.$app = $app;
    this.postIts = [];
    // 포스트잇 z-index 순서 관리용 카운터는 ZIndexManager로 위임
    // 옵션: 헤더 항상 보이기 (추후 변경 가능)
    this.options = {
      alwaysShowHeader: true,
    };
    this.loadPostIts();
    this.setupContextMenu();

    // 화면 크기 변경에 대응: 리사이즈 시 포스트잇을 화면 안으로 클램프
    this._onResize = this._debounce(() => this.clampAllToViewportRenderOnly(), 120);
    window.addEventListener('resize', this._onResize);

    // ResizeObserver 저장 억제용 플래그/카운터 및 디바운서 저장소
    this._suppressResizeSave = 0;
    this._resizeTimers = new Map();
  }

  async loadPostIts() {
    try {
      const savedPostIts = await Storage.getPostIts();
      this.postIts = savedPostIts || [];
      const maxZ = this.postIts.reduce((m, p) => (typeof p.z === 'number' ? Math.max(m, p.z) : m), 1000);
      ZIndexManager.setMax(maxZ);
      this.postIts.forEach(postIt => {
        this.createPostItElement(postIt);
      });
    } catch (error) {
      console.error('포스트잇 로드 실패:', error);
    }
  }

  createPostItElement(postIt) {
    const postItElement = document.createElement('div');
    postItElement.className = 'post-it';
    postItElement.dataset.postItId = postIt.id;
    postItElement.style.cssText = `
      position: absolute;
      left: ${postIt.x}px;
      top: ${postIt.y}px;
      width: ${postIt.width || 200}px;
      height: ${postIt.height || 200}px;
      background: ${postIt.color || '#fff9c4'};
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      padding: 5px;
      z-index: 1000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      overflow: hidden;
      resize: both;
      min-width: 150px;
      min-height: 150px;
      min-width: 150px;
      min-height: 150px;
      user-select: none;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    `;
    // 저장된 z 순서 적용(없으면 생성하며 저장)
    let z = postIt.z;
    if (typeof z !== 'number') {
      z = ZIndexManager.getNextIndex();
      postIt.z = z;
      // 최초 마이그레이션: z가 없던 데이터는 즉시 저장
      this.savePostIt(postIt);
    } else {
      ZIndexManager.setMax(z);
    }
    postItElement.style.zIndex = String(z);

    // 포스트잇 헤더 (드래그 영역, 색상 변경, 삭제 버튼)
    const header = document.createElement('div');
    header.className = 'post-it-header';
    const headerBg = this._deriveHeaderColor(postIt.color || '#fff9c4');
    header.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 30px;
      transform: translateY(-32px);
      transition: transform 0.2s;
      background: ${headerBg};
      cursor: move;
      z-index: 10;
      display: flex;
      flex-direction: row;
      justify-content: flex-start;
      align-items: center;
      padding: 0 8px;
    `;

    // 접기/펼치기 버튼
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'collapse-btn';
    // 접힘(true) -> 펼치기(▼), 펼쳐짐(false) -> 접기(▲)
    collapseBtn.innerHTML = postIt.isCollapsed ? '▼' : '▲';
    collapseBtn.title = postIt.isCollapsed ? '펼치기' : '접기';

    // 스타일은 CSS(style.css)로 이동하거나 여기서 최소한만
    collapseBtn.style.cssText = `
       width: 20px;
       height: 20px;
       display: flex;
       align-items: center;
       justify-content: center;
       background: transparent;
       border: none;
       cursor: pointer;
       font-size: 14px;
       margin-right: 4px;
       padding: 0;
       color: #555;
    `;

    // 색상 변경 버튼
    const colorBtn = document.createElement('button');
    colorBtn.className = 'color-btn';
    colorBtn.innerHTML = '<span class="color-icon">🎨</span>';

    // 닫기 버튼
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    // closeBtn.style.marginLeft = 'auto'; // (삭제: 제목이 flex:1로 밀어냄)
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = confirm('이 포스트잇을 삭제하시겠습니까?');
      if (confirmed) {
        await this.deletePostIt(postIt.id);
        postItElement.remove();
      }
    });

    // 제목 입력 (중앙)
    const titleInput = document.createElement('input');
    titleInput.className = 'post-it-title';
    titleInput.type = 'text';
    titleInput.value = postIt.title || '';
    // titleInput.placeholder = '제목'; // (삭제: 비워두기 요청 반영)
    titleInput.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: auto;
      max-width: calc(100% - 120px); /* 좌우 버튼 영역 침범 방지 */
      background: transparent;
      border: none;
      outline: none;
      text-align: center;
      font-family: inherit;
      font-size: 14px;
      font-weight: bold;
      color: inherit; /* 버튼과 동일한 기본 색상 */
      margin: 0;
      padding: 0;
    `;
    // 제목 변경 시 저장 (드래그 방지 리스너 제거됨)
    titleInput.addEventListener('input', () => {
      postIt.title = titleInput.value;
      this.savePostIt(postIt);
    });

    // 색상 팔레트
    const colorPalette = document.createElement('div');
    colorPalette.className = 'color-palette';
    colorPalette.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      background: transparent;
      border: none;
      border-radius: 4px;
      padding: 8px;
      display: none;
      grid-template-columns: repeat(5, 1fr);
      gap: 4px;
      z-index: 1001;
    `;

    const colors = [
      '#fff9c4', '#ffcdd2', '#f8bbd9', '#e1bee7', '#d1c4e9',
      '#c5cae9', '#bbdefb', '#b3e5fc', '#b2ebf2', '#b2dfdb',
      '#2f2f2f'
    ];

    colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.style.cssText = `
        width: 20px;
        height: 20px;
        background: ${color};
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid rgba(255,255,255,0.8);
        transition: border-color 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      `;
      colorOption.addEventListener('click', () => {
        postItElement.style.background = color;
        postIt.color = color;
        // 헤더 색상도 본문 색상에 맞게 조정
        header.style.background = this._deriveHeaderColor(color);
        // 회색(#2f2f2f)일 때 본문 글자색을 흰색으로
        if ((color || '').toLowerCase() === '#2f2f2f') {
          content.style.color = '#ffffff';
          titleInput.style.color = '#ffffff'; // 제목도 흰색
        } else {
          content.style.color = '';
          titleInput.style.color = '';
        }
        this.savePostIt(postIt);
        colorPalette.style.display = 'none';
      });
      colorPalette.appendChild(colorOption);
    });

    colorBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = colorPalette.style.display === 'grid';
      colorPalette.style.display = isOpen ? 'none' : 'grid';
      if (!isOpen) {
        // document 클릭 시 팔레트 닫기
        const closePalette = (ev) => {
          if (!colorPalette.contains(ev.target) && ev.target !== colorBtn) {
            colorPalette.style.display = 'none';
            document.removeEventListener('click', closePalette);
          }
        };
        setTimeout(() => {
          // mousedown 전파 차단과 무관하게 동작하도록 click 사용
          document.addEventListener('click', closePalette);
        }, 0);
      }
    });

    // 팔레트 내부 클릭/드래그는 이벤트 전파 막기
    colorPalette.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    colorPalette.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    colorPalette.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });

    header.appendChild(collapseBtn);
    header.appendChild(colorBtn);
    header.appendChild(titleInput); // 중간에 제목
    header.appendChild(closeBtn);
    header.appendChild(colorPalette);

    // 포스트잇 내용
    const content = document.createElement('div');
    content.className = 'post-it-content';
    content.contentEditable = true;
    content.innerHTML = postIt.content || '메모를 입력하세요...';
    content.style.cssText = `
      width: 100%;
      height: 100%;
      outline: none;
      border: none;
      background: transparent;
      resize: none;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      overflow: auto;
      user-select: text;
    `;
    // 초기 로드 시 회색 배경인 경우 본문 글자색 흰색 적용
    if ((postIt.color || '').toLowerCase() === '#2f2f2f') {
      content.style.color = '#ffffff';
      titleInput.style.color = '#ffffff';
    }

    postItElement.appendChild(header);
    postItElement.appendChild(content);

    // 접기/펼치기 동작
    const toggleCollapse = () => {
      // 1. 애니메이션을 위한 트랜지션 활성화
      postItElement.style.transition = 'height 0.3s ease, min-height 0.3s ease, box-shadow 0.2s ease, transform 0.2s ease';

      postIt.isCollapsed = !postIt.isCollapsed;
      // 아이콘 업데이트
      collapseBtn.innerHTML = postIt.isCollapsed ? '▼' : '▲';
      collapseBtn.title = postIt.isCollapsed ? '펼치기' : '접기';

      updateCollapseState();
      this.savePostIt(postIt);

      // 2. 애니메이션 종료 후 트랜지션 제거 (리사이즈 성능을 위해)
      // transitionend 이벤트는 여러 속성에 대해 발생하므로 한 번만 처리되도록 주의하거나 타임아웃 사용
      const cleanup = () => {
        postItElement.style.transition = 'box-shadow 0.2s ease, transform 0.2s ease';
      };

      // 혹시 transitionend가 발생하지 않을 경우를 대비해 setTimeout 병행
      /** 
       * 주의: transitionend만 믿으면 화면이 가려져 있거나 할 때 발생 안 할 수 있음. 
       * 안전하게 300ms + buffer 후에 복구.
       */
      setTimeout(cleanup, 350);
    };

    const updateCollapseState = () => {
      if (postIt.isCollapsed) {
        // content.style.display = 'none'; // 인위적 숨김 제거
        postItElement.style.minHeight = '30px'; // 최소 높이 해제
        postItElement.style.height = '30px';
        postItElement.style.resize = 'none';
      } else {
        // content.style.display = 'block';
        postItElement.style.minHeight = '150px'; // 최소 높이 복구
        postItElement.style.height = `${postIt.height || 200}px`;
        postItElement.style.resize = 'both';
      }
    };

    // 초기 상태 적용
    updateCollapseState();

    collapseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCollapse();
    });

    // 옵션에 따른 헤더 표시 방식 적용
    this._applyHeaderVisibility(header, content);

    // 드래그 기능 (헤더에서만)
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    // 헤더 포인터다운 시 맨 앞으로
    header.addEventListener('pointerdown', () => {
      bringToFront();
    });

    header.addEventListener('pointerdown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = parseInt(postItElement.style.left);
      initialTop = parseInt(postItElement.style.top);
    });

    document.addEventListener('pointermove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      postItElement.style.left = `${initialLeft + dx}px`;
      postItElement.style.top = `${initialTop + dy}px`;
    });

    document.addEventListener('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        // 위치 저장 전에 화면 안으로 클램프
        this._clampElementToViewport(postItElement, postIt);
        // 위치 저장
        postIt.x = parseInt(postItElement.style.left);
        postIt.y = parseInt(postItElement.style.top);
        this.savePostIt(postIt);
      }
    });

    // ResizeObserver: 사용자가 네이티브 리사이즈 핸들로 크기를 변경했을 때 저장
    const resizeObserver = new ResizeObserver((entries) => {
      if (this._suppressResizeSave > 0) return; // 렌더링 보정 중에는 저장 금지
      for (const entry of entries) {
        const id = postIt.id;
        // 디바운스: 빠른 연속 이벤트 중 마지막만 처리
        clearTimeout(this._resizeTimers.get(id));
        this._resizeTimers.set(id, setTimeout(() => {
          // 현재 크기 계산
          const width = Math.max(50, Math.round(entry.contentRect.width));
          const height = Math.max(50, Math.round(entry.contentRect.height));
          // 요소 스타일에 반영되어 있을 것이므로, 뷰포트에 맞게 최종 클램프 + 데이터 저장

          if (!postIt.isCollapsed) {
            postIt.width = width;
            postIt.height = height;
          } else {
            // 접힌 상태에서는 width만 저장 (height는 고정이므로 저장 안 함)
            postIt.width = width;
          }
          // 위치/사이즈를 뷰포트 내로 보정하면서 데이터도 함께 갱신
          this._clampElementToViewport(postItElement, postIt, { clampSize: true, mutate: true });
          this.savePostIt(postIt);
        }, 120));
      }
    });
    resizeObserver.observe(postItElement);

    // 내용 변경 시 저장
    content.addEventListener('input', () => {
      postIt.content = content.innerHTML;
      this.savePostIt(postIt);
    });

    // 엔터 키 처리
    content.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertLineBreak', false, null);
      }
    });

    // 포커스 시 플레이스홀더 제거
    content.addEventListener('focus', () => {
      if (content.innerHTML === '메모를 입력하세요...') {
        content.innerHTML = '';
      }
    });

    // 블러 시 빈 내용이면 플레이스홀더 추가
    content.addEventListener('blur', () => {
      if (content.innerHTML.replace(/<br\s*\/?>/gi, '').trim() === '') {
        content.innerHTML = '메모를 입력하세요...';
      }
    });

    // 포스트잇 활성화/비활성화 및 z-index 올리기
    const bringToFront = () => {
      const nextZ = ZIndexManager.getNextIndex();
      postIt.z = nextZ;
      postItElement.style.zIndex = String(nextZ);
      this.savePostIt(postIt);
    };
    function activate() {
      document.querySelectorAll('.post-it.active').forEach(el => el.classList.remove('active'));
      postItElement.classList.add('active');
      // 클릭 시 항상 맨 앞으로
      bringToFront();
    }
    function deactivateAll(e) {
      if (!postItElement.contains(e.target)) {
        postItElement.classList.remove('active');
        colorPalette.style.display = 'none';
      }
    }
    postItElement.addEventListener('mousedown', (e) => {
      activate();
    });
    content.addEventListener('focus', activate);
    document.addEventListener('mousedown', deactivateAll);

    const stop = (e) => { e.stopPropagation(); };
    postItElement.addEventListener('pointerdown', stop, { capture: false });
    postItElement.addEventListener('mousedown', stop, { capture: false });
    postItElement.addEventListener('touchstart', stop, { capture: false });
    postItElement.addEventListener('dragstart', stop, { capture: false });

    // MutationObserver는 사용하지 않음 (ResizeObserver로 대체)

    // 초기 로드 시 화면을 벗어나 있으면 렌더링만 안으로 이동(저장은 하지 않음)
    this._withResizeSaveSuppressed(() => {
      this._clampElementToViewport(postItElement, postIt, { clampSize: true, mutate: false });
    });

    this.$app.appendChild(postItElement);
  }

  // 옵션에 따라 헤더 표시/숨김 적용 및 본문 패딩 조정
  _applyHeaderVisibility(headerEl, contentEl) {
    const visible = !!this.options?.alwaysShowHeader;
    if (!headerEl || !contentEl) return;
    if (visible) {
      headerEl.style.transform = 'translateY(0)';
      // 헤더가 본문을 가리지 않도록 상단 패딩 확보
      if (!contentEl.style.paddingTop) contentEl.style.paddingTop = '32px';
    } else {
      headerEl.style.transform = 'translateY(-32px)';
      // 기존 동작으로 복귀: 패딩 해제
      contentEl.style.paddingTop = '';
    }
  }

  // 공개 옵션 설정 API: 기존 포스트잇에도 즉시 반영
  setAlwaysShowHeader(flag) {
    this.options.alwaysShowHeader = !!flag;
    const items = Array.from(document.querySelectorAll('.post-it'));
    items.forEach(el => {
      const header = el.querySelector('.post-it-header');
      const content = el.querySelector('.post-it-content');
      if (header && content) this._applyHeaderVisibility(header, content);
    });
  }

  async createPostIt(x, y) {
    const newPostIt = {
      id: Date.now().toString(),
      x: x,
      y: y,
      width: 200,
      height: 200,
      color: '#fff9c4',
      content: '메모를 입력하세요...',
      createdAt: new Date().toISOString(),
      z: ZIndexManager.getNextIndex(),
      isCollapsed: false,
      title: ''
    };

    this.postIts.push(newPostIt);
    await this.savePostIt(newPostIt);
    this.createPostItElement(newPostIt);
  }

  async savePostIt(postIt) {
    try {
      const index = this.postIts.findIndex(p => p.id === postIt.id);
      if (index !== -1) {
        this.postIts[index] = postIt;
      }
      await Storage.setPostIts(this.postIts);
    } catch (error) {
      console.error('포스트잇 저장 실패:', error);
    }
  }

  async deletePostIt(postItId) {
    try {
      this.postIts = this.postIts.filter(p => p.id !== postItId);
      await Storage.setPostIts(this.postIts);
    } catch (error) {
      console.error('포스트잇 삭제 실패:', error);
    }
  }

  setupContextMenu() {
    // 기존 우클릭 메뉴에 포스트잇 옵션 추가
    document.addEventListener('contextmenu', (e) => {
      // 포스트잇 요소나 이미지 요소에서 우클릭한 경우 무시
      if (e.target.closest('.post-it') || e.target.closest('[data-image-src]')) {
        return;
      }

      // node-wrapper에서 우클릭한 경우 기존 메뉴 사용
      if (e.target.className.includes("node-wrapper")) {
        return;
      }

      // 기존 메뉴들 제거
      document.querySelectorAll('.options').forEach(el => el.remove());
      document.querySelectorAll('.post-it-context-menu').forEach(el => el.remove());

      // 포스트잇 컨텍스트 메뉴 생성
      const contextMenu = document.createElement('div');
      contextMenu.className = 'post-it-context-menu';
      contextMenu.style.cssText = `
        position: fixed;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px 0;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        min-width: 150px;
      `;

      const createPostItOption = document.createElement('div');
      createPostItOption.innerHTML = `
        <span style="display:inline-flex;width:16px;height:16px;margin-right:8px;align-items:center;justify-content:center;">
          <img src="assets/postit-icon.svg" alt="" style="width:16px;height:16px;display:block;"/>
        </span>
        <span>포스트잇 생성</span>
      `;
      createPostItOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        transition: background-color 0.2s ease;
      `;

      createPostItOption.addEventListener('mouseenter', () => {
        createPostItOption.style.backgroundColor = '#f5f5f5';
      });

      createPostItOption.addEventListener('mouseleave', () => {
        createPostItOption.style.backgroundColor = 'transparent';
      });

      createPostItOption.addEventListener('click', () => {
        this.createPostIt(e.clientX, e.clientY);
        contextMenu.remove();
      });

      contextMenu.appendChild(createPostItOption);
      document.body.appendChild(contextMenu);

      // 메뉴 위치 설정
      contextMenu.style.left = e.clientX + 'px';
      contextMenu.style.top = e.clientY + 'px';

      // 메뉴 외부 클릭 시 닫기
      const closeMenu = () => {
        contextMenu.remove();
        document.removeEventListener('click', closeMenu);
      };

      setTimeout(() => {
        document.addEventListener('click', closeMenu);
      }, 0);
    });
  }

  // =====================
  // Helper utilities
  // =====================
  _debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  _viewportSize() {
    // 스크롤이 없도록 설계된 새 탭 페이지 기준
    const w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    return { w, h };
  }

  _clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // 포스트잇을 화면 내부로 강제 이동/리사이즈. 변동이 있으면 true 반환
  _clampElementToViewport(el, data, opts = {}) {
    const { clampSize = true, mutate = true } = opts;
    const margin = 8; // 화면 여백
    const { w: vw, h: vh } = this._viewportSize();
    const isCollapsed = data && data.isCollapsed;

    // 현재 사이즈 계산
    const styleW = parseInt(el.style.width) || el.offsetWidth || 200;
    const styleH = parseInt(el.style.height) || el.offsetHeight || 200;

    let newW = styleW;
    let newH = styleH;
    if (clampSize) {
      const maxW = Math.max(50, vw - margin * 2);
      const maxH = Math.max(50, vh - margin * 2);

      // 최소값 설정: 접힌 상태면 30, 아니면 150
      const minDimensionStart = isCollapsed ? 30 : 150;

      newW = this._clamp(styleW, Math.min(150, maxW), maxW);
      // 높이는 접혔으면 그대로(혹은 30), 아니면 클램핑
      // 접힌 상태라고 해도 화면 밖으로 나가면 안되므로 maxH 체크는 필요
      // 단 minH 체크는 30으로
      newH = this._clamp(styleH, Math.min(minDimensionStart, maxH), maxH);
    }

    // 위치 계산
    const left = parseInt(el.style.left) || 0;
    const top = parseInt(el.style.top) || 0;
    const maxLeft = Math.max(margin, vw - (newW) - margin);
    const maxTop = Math.max(margin, vh - (newH) - margin);
    const newLeft = this._clamp(left, margin, maxLeft);
    const newTop = this._clamp(top, margin, maxTop);

    let changed = false;
    if (clampSize && (newW !== styleW || newH !== styleH)) {
      el.style.width = `${newW}px`;
      el.style.height = `${newH}px`;
      if (data && mutate) {
        data.width = newW;
        // 접힌 상태면 높이 저장을 하지 않음 (원래 높이 보존)
        if (!isCollapsed) {
          data.height = newH;
        }
      }
      changed = true;
    }
    if (newLeft !== left || newTop !== top) {
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      if (data && mutate) {
        data.x = newLeft;
        data.y = newTop;
      }
      changed = true;
    }
    return changed;
  }

  // 리사이즈 시 모든 포스트잇을 화면 안으로 이동시키되, 저장은 하지 않음
  clampAllToViewportRenderOnly() {
    const elements = Array.from(document.querySelectorAll('.post-it'));
    this._withResizeSaveSuppressed(() => {
      elements.forEach((el) => {
        const id = el.dataset.postItId;
        const data = this.postIts.find(p => p.id === id);
        if (!data) return;
        // 저장된 원본 위치/크기를 다시 적용한 뒤, 화면에 맞게 렌더링만 보정
        if (typeof data.x === 'number') el.style.left = `${data.x}px`;
        if (typeof data.y === 'number') el.style.top = `${data.y}px`;
        if (typeof data.width === 'number') el.style.width = `${data.width}px`;

        // 높이 복원: 접힌 상태면 30, 아니면 원래 높이
        if (data.isCollapsed) {
          el.style.height = '30px';
        } else if (typeof data.height === 'number') {
          el.style.height = `${data.height}px`;
        }

        this._clampElementToViewport(el, data, { clampSize: true, mutate: false });
      });
    });
  }

  _withResizeSaveSuppressed(fn) {
    this._suppressResizeSave++;
    try { fn(); }
    finally {
      // 다음 프레임까지 유지해 ResizeObserver 연계 이벤트도 무시
      requestAnimationFrame(() => { this._suppressResizeSave = Math.max(0, this._suppressResizeSave - 1); });
    }
  }

  // =====================
  // Color helpers for header derivation
  // =====================
  _deriveHeaderColor(baseHex) {
    try {
      const { r, g, b } = this._hexToRgb(baseHex);
      const brightness = this._perceivedBrightness(r, g, b);
      // 밝은 메모 → 헤더를 약간 어둡게, 어두운 메모 → 헤더를 약간 밝게
      const delta = brightness > 170 ? -20 : +20;
      const { r: rr, g: gg, b: bb } = this._adjustBrightness({ r, g, b }, delta);
      return this._rgbToHex(rr, gg, bb);
    } catch {
      return baseHex;
    }
  }

  _hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) {
      c = c.split('').map(ch => ch + ch).join('');
    }
    const num = parseInt(c, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  _rgbToHex(r, g, b) {
    const toHex = (v) => v.toString(16).padStart(2, '0');
    return '#' + toHex(Math.max(0, Math.min(255, r))) + toHex(Math.max(0, Math.min(255, g))) + toHex(Math.max(0, Math.min(255, b)));
  }

  _adjustBrightness({ r, g, b }, delta) {
    return {
      r: Math.max(0, Math.min(255, r + delta)),
      g: Math.max(0, Math.min(255, g + delta)),
      b: Math.max(0, Math.min(255, b + delta))
    };
  }

  _perceivedBrightness(r, g, b) {
    // W3C 가이드: https://www.w3.org/TR/AERT/#color-contrast
    return Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );
  }
} 