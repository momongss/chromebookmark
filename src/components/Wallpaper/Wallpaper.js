import Storage from "../../utils/storage.js";

export default class Wallpaper {
  constructor() {
    this.backgroundElement = null;
    this.menuElement = null;
    this.menuBtnElement = null;
    this.defaultWallpapers = [
      {
        name: "하늘",
        src: `chrome-extension://${chrome.runtime.id}/assets/wallpaper/sky6.png`
      },
      {
        name: "자연",
        src: `chrome-extension://${chrome.runtime.id}/assets/wallpaper/nature.jpg`
      },
      {
        name: "도시",
        src: `chrome-extension://${chrome.runtime.id}/assets/wallpaper/city.jpg`
      }
    ];
    this._constructor();
  }

  async _constructor() {
    await this.createBackgroundElement();
    this.createMenuButton();
    this.createMenu();
    this.setupEventListeners();
    this.render();
  }

  async createBackgroundElement() {
    this.backgroundElement = document.createElement("img");
    this.backgroundElement.className = "background-img";
    
    try {
      const backgroundImgSrc = await Storage.getBackgroundImage();
      this.backgroundElement.src = backgroundImgSrc || this.defaultWallpapers[0].src;
    } catch (error) {
      console.error('배경화면 로드 실패:', error);
      this.backgroundElement.src = this.defaultWallpapers[0].src;
    }

    // 배경화면 로드 실패 시 기본 이미지로 fallback
    this.backgroundElement.onerror = () => {
      console.warn('배경화면 로드 실패, 기본 이미지로 대체');
      this.backgroundElement.src = this.defaultWallpapers[0].src;
    };

    document.body.prepend(this.backgroundElement);
  }

  createMenuButton() {
    this.menuBtnElement = document.createElement("div");
    this.menuBtnElement.className = "menu-btn";
    this.menuBtnElement.innerHTML = `
      <span class="menu-btn-text">배경화면</span>
      <span class="menu-btn-icon">🎨</span>
    `;
    this.menuBtnElement.setAttribute('role', 'button');
    this.menuBtnElement.setAttribute('tabindex', '0');
    this.menuBtnElement.setAttribute('aria-label', '배경화면 설정 메뉴 열기');
    
    document.body.appendChild(this.menuBtnElement);
  }

  createMenu() {
    this.menuElement = document.createElement("div");
    this.menuElement.className = "menu-wrapper";
    this.menuElement.setAttribute('role', 'dialog');
    this.menuElement.setAttribute('aria-label', '배경화면 설정');
    
    this.menuElement.innerHTML = `
      <div class="menu">
        <div class="menu-header">
          <h3>배경화면 선택</h3>
          <button class="close-btn" aria-label="메뉴 닫기">×</button>
        </div>
        
        <div class="wallpaper-options">
          <div class="default-wallpapers">
            <h4>기본 배경화면</h4>
            <div class="wallpaper-grid">
              ${this.defaultWallpapers.map((wallpaper, index) => `
                <div class="wallpaper-item" data-wallpaper-index="${index}" role="button" tabindex="0">
                  <img src="${wallpaper.src}" alt="${wallpaper.name}" loading="lazy">
                  <span class="wallpaper-name">${wallpaper.name}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="custom-wallpaper">
            <h4>커스텀 배경화면</h4>
            <div class="file-upload-area">
              <input type="file" id="wallpaper-upload" accept="image/*" aria-label="배경화면 이미지 선택">
              <label for="wallpaper-upload" class="upload-btn">
                <span class="upload-icon">📁</span>
                <span class="upload-text">이미지 파일 선택</span>
              </label>
            </div>
            <div class="upload-info">
              <small>지원 형식: JPG, PNG, GIF, WebP (최대 10MB)</small>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.menuElement);
  }

  setupEventListeners() {
    // 메뉴 버튼 클릭
    this.menuBtnElement.addEventListener('click', () => this.toggleMenu());
    this.menuBtnElement.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleMenu();
      }
    });

    // 메뉴 외부 클릭 시 닫기
    this.menuElement.addEventListener('click', (e) => {
      if (e.target === this.menuElement) {
        this.closeMenu();
      }
    });

    // 닫기 버튼
    const closeBtn = this.menuElement.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => this.closeMenu());

    // 기본 배경화면 선택
    const wallpaperItems = this.menuElement.querySelectorAll('.wallpaper-item');
    wallpaperItems.forEach(item => {
      item.addEventListener('click', () => this.selectWallpaper(item));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectWallpaper(item);
        }
      });
    });

    // 파일 업로드
    const fileInput = this.menuElement.querySelector('#wallpaper-upload');
    fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

    // ESC 키로 메뉴 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.menuElement.classList.contains('show')) {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    this.menuElement.classList.toggle('show');
    if (this.menuElement.classList.contains('show')) {
      this.menuElement.querySelector('.close-btn').focus();
    }
  }

  closeMenu() {
    this.menuElement.classList.remove('show');
    this.menuBtnElement.focus();
  }

  async selectWallpaper(item) {
    const index = parseInt(item.dataset.wallpaperIndex);
    const wallpaper = this.defaultWallpapers[index];
    
    try {
      await this.setBackgroundImage(wallpaper.src);
      this.closeMenu();
    } catch (error) {
      console.error('배경화면 설정 실패:', error);
      this.showError('배경화면 설정에 실패했습니다.');
    }
  }

  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 크기 체크 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showError('파일 크기가 10MB를 초과합니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      this.showError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        await this.setBackgroundImage(e.target.result);
        this.closeMenu();
      };
      reader.onerror = () => {
        this.showError('파일 읽기에 실패했습니다.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      this.showError('파일 업로드에 실패했습니다.');
    }
  }

  async setBackgroundImage(src) {
    try {
      await Storage.setBackgroundImage(src);
      this.backgroundElement.src = src;
    } catch (error) {
      console.error('배경화면 저장 실패:', error);
      throw error;
    }
  }

  showError(message) {
    // 간단한 에러 메시지 표시
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 3000);
  }

  render() {
    // 추가 렌더링 로직이 필요한 경우 여기에 구현
  }

  eventListeners() {
    // 추가 이벤트 리스너가 필요한 경우 여기에 구현
  }
}
