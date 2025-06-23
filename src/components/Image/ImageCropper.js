export default class ImageCropper {
  constructor() {
    this.cropOverlay = null;
    this.cropHandles = {};
    this.isCropping = false;
    this.startX = 0;
    this.startY = 0;
    this.initialLeft = 0;
    this.initialTop = 0;
    this.initialWidth = 0;
    this.initialHeight = 0;
    this.currentHandle = null;
    this.onCropComplete = null;
  }

  createCropOverlay(imageElement) {
    // 기존 크롭 오버레이가 있다면 제거
    if (this.cropOverlay) {
      this.cropOverlay.remove();
    }

    // 크롭 오버레이 생성
    this.cropOverlay = document.createElement('div');
    this.cropOverlay.style.position = 'absolute';
    this.cropOverlay.style.border = '2px dashed #fff';
    this.cropOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.cropOverlay.style.cursor = 'move';
    this.cropOverlay.style.zIndex = '1000';
    this.cropOverlay.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';

    // 이미지의 위치와 크기를 가져와서 오버레이 설정
    const rect = imageElement.getBoundingClientRect();
    this.cropOverlay.style.left = `${rect.left}px`;
    this.cropOverlay.style.top = `${rect.top}px`;
    this.cropOverlay.style.width = `${rect.width}px`;
    this.cropOverlay.style.height = `${rect.height}px`;

    // 크롭 핸들 생성
    this.createCropHandles();

    // 이벤트 리스너 추가
    this.addEventListeners();

    // 오버레이를 DOM에 추가
    document.body.appendChild(this.cropOverlay);
  }

  createCropHandles() {
    const positions = ['nw', 'ne', 'sw', 'se'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.style.position = 'absolute';
      handle.style.width = '10px';
      handle.style.height = '10px';
      handle.style.backgroundColor = '#fff';
      handle.style.border = '1px solid #666';
      handle.style.borderRadius = '50%';
      handle.style.cursor = `${pos}-resize`;
      handle.style.zIndex = '1001';

      // 핸들의 위치 설정
      switch(pos) {
        case 'nw':
          handle.style.top = '-5px';
          handle.style.left = '-5px';
          break;
        case 'ne':
          handle.style.top = '-5px';
          handle.style.right = '-5px';
          break;
        case 'sw':
          handle.style.bottom = '-5px';
          handle.style.left = '-5px';
          break;
        case 'se':
          handle.style.bottom = '-5px';
          handle.style.right = '-5px';
          break;
      }

      this.cropHandles[pos] = handle;
      this.cropOverlay.appendChild(handle);
    });
  }

  addEventListeners() {
    // 오버레이 드래그 이벤트
    this.cropOverlay.addEventListener('pointerdown', (e) => {
      if (e.target === this.cropOverlay) {
        this.isCropping = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.initialLeft = parseInt(this.cropOverlay.style.left);
        this.initialTop = parseInt(this.cropOverlay.style.top);
      }
    });

    // 핸들 리사이즈 이벤트
    Object.entries(this.cropHandles).forEach(([pos, handle]) => {
      handle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.isCropping = true;
        this.currentHandle = pos;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.initialLeft = parseInt(this.cropOverlay.style.left);
        this.initialTop = parseInt(this.cropOverlay.style.top);
        this.initialWidth = parseInt(this.cropOverlay.style.width);
        this.initialHeight = parseInt(this.cropOverlay.style.height);
      });
    });

    // 마우스 이동 이벤트
    document.addEventListener('pointermove', (e) => {
      if (!this.isCropping) return;

      if (this.currentHandle) {
        this.handleResize(e);
      } else {
        this.handleDrag(e);
      }
    });

    // 마우스 업 이벤트
    document.addEventListener('pointerup', () => {
      this.isCropping = false;
      this.currentHandle = null;
    });
  }

  handleDrag(e) {
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    this.cropOverlay.style.left = `${this.initialLeft + dx}px`;
    this.cropOverlay.style.top = `${this.initialTop + dy}px`;
  }

  handleResize(e) {
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    let newLeft = this.initialLeft;
    let newTop = this.initialTop;
    let newWidth = this.initialWidth;
    let newHeight = this.initialHeight;

    switch(this.currentHandle) {
      case 'nw':
        newWidth = this.initialWidth - dx;
        newHeight = newWidth;
        newLeft = this.initialLeft + dx;
        newTop = this.initialTop + dx;
        break;
      case 'ne':
        newWidth = this.initialWidth + dx;
        newHeight = newWidth;
        newTop = this.initialTop - dx;
        break;
      case 'sw':
        newWidth = this.initialWidth - dx;
        newHeight = newWidth;
        newLeft = this.initialLeft + dx;
        break;
      case 'se':
        newWidth = this.initialWidth + dx;
        newHeight = newWidth;
        break;
    }

    // 최소 크기 제한
    if (newWidth >= 50 && newHeight >= 50) {
      this.cropOverlay.style.left = `${newLeft}px`;
      this.cropOverlay.style.top = `${newTop}px`;
      this.cropOverlay.style.width = `${newWidth}px`;
      this.cropOverlay.style.height = `${newHeight}px`;
    }
  }

  cropImage(imageElement) {
    return new Promise((resolve) => {
      this.createCropOverlay(imageElement);

      // 확인 버튼 생성
      const confirmButton = document.createElement('button');
      confirmButton.textContent = '자르기';
      confirmButton.style.position = 'fixed';
      confirmButton.style.bottom = '20px';
      confirmButton.style.left = '50%';
      confirmButton.style.transform = 'translateX(-50%)';
      confirmButton.style.padding = '8px 16px';
      confirmButton.style.backgroundColor = '#4CAF50';
      confirmButton.style.color = 'white';
      confirmButton.style.border = 'none';
      confirmButton.style.borderRadius = '4px';
      confirmButton.style.cursor = 'pointer';
      confirmButton.style.zIndex = '1002';

      // 취소 버튼 생성
      const cancelButton = document.createElement('button');
      cancelButton.textContent = '취소';
      cancelButton.style.position = 'fixed';
      cancelButton.style.bottom = '20px';
      cancelButton.style.left = 'calc(50% + 80px)';
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.backgroundColor = '#f44336';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.style.zIndex = '1002';

      document.body.appendChild(confirmButton);
      document.body.appendChild(cancelButton);

      // 확인 버튼 클릭 이벤트
      confirmButton.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 크롭 영역의 위치와 크기 계산
        const cropRect = this.cropOverlay.getBoundingClientRect();
        const imageRect = imageElement.getBoundingClientRect();
        
        // 캔버스 크기 설정
        canvas.width = cropRect.width;
        canvas.height = cropRect.height;
        
        // 이미지 그리기
        ctx.drawImage(
          imageElement,
          cropRect.left - imageRect.left,
          cropRect.top - imageRect.top,
          cropRect.width,
          cropRect.height,
          0,
          0,
          cropRect.width,
          cropRect.height
        );

        // 결과 이미지 URL 생성
        const croppedImageUrl = canvas.toDataURL('image/png');
        
        // 정리
        this.cleanup();
        resolve(croppedImageUrl);
      });

      // 취소 버튼 클릭 이벤트
      cancelButton.addEventListener('click', () => {
        this.cleanup();
        resolve(null);
      });
    });
  }

  cleanup() {
    if (this.cropOverlay) {
      this.cropOverlay.remove();
      this.cropOverlay = null;
    }
    // 버튼들 제거
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (button.textContent === '자르기' || button.textContent === '취소') {
        button.remove();
      }
    });
  }
} 