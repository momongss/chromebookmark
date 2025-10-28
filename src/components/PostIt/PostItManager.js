import Storage from "../../utils/storage.js";

export default class PostItManager {
  constructor($app) {
    this.$app = $app;
    this.postIts = [];
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
      padding: 0;
      cursor: move;
      z-index: 1000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      overflow: hidden;
      resize: both;
      min-width: 150px;
      min-height: 150px;
      user-select: none;
    `;

    // 포스트잇 헤더 (드래그 영역, 색상 변경, 삭제 버튼)
    const header = document.createElement('div');
    header.className = 'post-it-header';
    header.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 40px;
      transform: translateY(-32px);
      transition: transform 0.2s;
      background: #ffd43b;
      z-index: 10;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px;
    `;

    // 색상 변경 버튼
    const colorBtn = document.createElement('button');
    colorBtn.className = 'color-btn';
    colorBtn.innerHTML = '<span class="color-icon">🎨</span>';

    // 닫기 버튼
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const confirmed = confirm('이 포스트잇을 삭제하시겠습니까?');
      if (confirmed) {
        await this.deletePostIt(postIt.id);
        postItElement.remove();
      }
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
      '#c5cae9', '#bbdefb', '#b3e5fc', '#b2ebf2', '#b2dfdb'
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
            document.removeEventListener('mousedown', closePalette);
          }
        };
        setTimeout(() => {
          document.addEventListener('mousedown', closePalette);
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

    header.appendChild(colorBtn);
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

    postItElement.appendChild(header);
    postItElement.appendChild(content);

    // 드래그 기능 (헤더에서만)
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = parseInt(postItElement.style.left);
      initialTop = parseInt(postItElement.style.top);
      
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      postItElement.style.left = `${initialLeft + dx}px`;
      postItElement.style.top = `${initialTop + dy}px`;
    });

    document.addEventListener('mouseup', () => {
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
          postIt.width = width;
          postIt.height = height;
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

    // 포스트잇 활성화/비활성화
    function activate() {
      document.querySelectorAll('.post-it.active').forEach(el => el.classList.remove('active'));
      postItElement.classList.add('active');
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

    // 기존 stopPropagation 유지
    postItElement.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
    postItElement.addEventListener('touchstart', (e) => { e.stopPropagation(); });

    // MutationObserver는 사용하지 않음 (ResizeObserver로 대체)

    // 초기 로드 시 화면을 벗어나 있으면 렌더링만 안으로 이동(저장은 하지 않음)
    this._withResizeSaveSuppressed(() => {
      this._clampElementToViewport(postItElement, postIt, { clampSize: true, mutate: false });
    });

    this.$app.appendChild(postItElement);
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
      createdAt: new Date().toISOString()
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
      createPostItOption.textContent = '📝 포스트잇 생성';
      createPostItOption.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
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

    // 현재 사이즈 계산
    const styleW = parseInt(el.style.width) || el.offsetWidth || 200;
    const styleH = parseInt(el.style.height) || el.offsetHeight || 200;

    let newW = styleW;
    let newH = styleH;
    if (clampSize) {
      const maxW = Math.max(50, vw - margin * 2);
      const maxH = Math.max(50, vh - margin * 2);
      // 최소값은 150, 단 화면이 너무 작으면 50까지 허용
      newW = this._clamp(styleW, Math.min(150, maxW), maxW);
      newH = this._clamp(styleH, Math.min(150, maxH), maxH);
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
        data.height = newH;
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
        if (typeof data.height === 'number') el.style.height = `${data.height}px`;
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
} 