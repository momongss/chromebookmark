import Storage from "../../utils/storage.js";

export default class PostItManager {
  constructor($app) {
    this.$app = $app;
    this.postIts = [];
    this.loadPostIts();
    this.setupContextMenu();
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
        
        // 위치 저장
        postIt.x = parseInt(postItElement.style.left);
        postIt.y = parseInt(postItElement.style.top);
        this.savePostIt(postIt);
      }
    });

    // 리사이즈 기능
    let isResizing = false;
    let startWidth, startHeight;

    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background: rgba(0,0,0,0.1);
      cursor: se-resize;
      border-radius: 0 0 8px 0;
    `;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(postItElement.style.width);
      startHeight = parseInt(postItElement.style.height);
      e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      const newWidth = Math.max(150, startWidth + dx);
      const newHeight = Math.max(150, startHeight + dy);
      
      postItElement.style.width = `${newWidth}px`;
      postItElement.style.height = `${newHeight}px`;
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        // 크기 저장
        postIt.width = parseInt(postItElement.style.width);
        postIt.height = parseInt(postItElement.style.height);
        this.savePostIt(postIt);
      }
    });

    postItElement.appendChild(resizeHandle);

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

    const observer = new MutationObserver(() => {
      const width = parseInt(postItElement.style.width);
      const height = parseInt(postItElement.style.height);
      if (width !== postIt.width || height !== postIt.height) {
        postIt.width = width;
        postIt.height = height;
        this.savePostIt(postIt);
      }
    });
    observer.observe(postItElement, { attributes: true, attributeFilter: ['style'] });

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
} 