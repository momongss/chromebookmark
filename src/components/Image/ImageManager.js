import Storage from "../../utils/storage.js";

export default class ImageManager {
  constructor($app) {
    this.$app = $app;
    this.loadImages();
    this.eventListeners();
    this.copiedImage = null; // 복사된 이미지 정보를 저장할 변수
    this.maxZIndex = 1; // 현재 최대 z-index 값
  }

  async loadImages() {
    const images = await Storage.getImages();
    images.forEach(image => {
      this.createImageElement(image);
    });
  }

  createImageElement(image) {
    // Create main container for both layers
    const mainContainer = document.createElement('div');
    mainContainer.style.position = 'absolute';
    mainContainer.style.left = `${image.x}px`;
    mainContainer.style.top = `${image.y}px`;
    mainContainer.dataset.imageSrc = image.src;

    // Create visual layer (behind bookmarks)
    const visualContainer = document.createElement('div');
    visualContainer.style.position = 'absolute';
    visualContainer.style.left = '0';
    visualContainer.style.top = '0';
    visualContainer.style.zIndex = '1';
    visualContainer.style.transition = 'none';

    // Create interaction layer (above bookmarks)
    const interactionContainer = document.createElement('div');
    interactionContainer.style.position = 'absolute';
    interactionContainer.style.left = '0';
    interactionContainer.style.top = '0';
    interactionContainer.style.zIndex = '1000';
    interactionContainer.style.pointerEvents = 'auto';
    interactionContainer.style.transition = 'none';

    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×';
    deleteBtn.style.position = 'absolute';
    deleteBtn.style.top = '-20px';
    deleteBtn.style.right = '-20px';
    deleteBtn.style.width = '20px';
    deleteBtn.style.height = '20px';
    deleteBtn.style.borderRadius = '50%';
    deleteBtn.style.border = 'none';
    deleteBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
    deleteBtn.style.color = 'white';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.display = 'none';
    deleteBtn.style.fontSize = '16px';
    deleteBtn.style.lineHeight = '1';
    deleteBtn.style.padding = '0';
    deleteBtn.style.textAlign = 'center';
    deleteBtn.style.zIndex = '1001';

    // Create resize handles
    const createResizeHandle = (position) => {
      const handle = document.createElement('div');
      handle.style.position = 'absolute';
      handle.style.width = '10px';
      handle.style.height = '10px';
      handle.style.backgroundColor = 'white';
      handle.style.border = '1px solid #666';
      handle.style.borderRadius = '50%';
      handle.style.cursor = position + '-resize';
      handle.style.display = 'none';
      handle.style.zIndex = '1001';

      switch(position) {
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

      return handle;
    };

    const nwHandle = createResizeHandle('nw');
    const neHandle = createResizeHandle('ne');
    const swHandle = createResizeHandle('sw');
    const seHandle = createResizeHandle('se');

    // Create image element
    const img = document.createElement('img');
    img.src = image.src;
    
    // 선택 상태 관리
    let isSelected = false;
    
    img.onload = async () => {
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const defaultWidth = 200;
      const defaultHeight = 200;
      
      let width = image.width || defaultWidth;
      let height = image.height || (defaultWidth / aspectRatio);
      
      // 초기 로드 시에만 기본 크기로 제한
      if (!image.width && !image.height) {
        if (height > defaultHeight) {
          height = defaultHeight;
          width = defaultHeight * aspectRatio;
        }
      }
      
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      
      // Set size for both containers
      visualContainer.style.width = `${width}px`;
      visualContainer.style.height = `${height}px`;
      interactionContainer.style.width = `${width}px`;
      interactionContainer.style.height = `${height}px`;
      
      // 이미지 크기 저장
      try {
        const images = await Storage.getImages();
        const index = images.findIndex(img => img.src === image.src);
        if (index !== -1) {
          images[index].width = parseFloat(width);
          images[index].height = parseFloat(height);
          await Storage.setImages(images);
        }
      } catch (error) {
        console.error('초기 이미지 크기 저장 중 오류 발생:', error);
      }
    };
    
    img.style.cursor = 'move';
    img.draggable = false;
    
    let isDragging = false;
    let isResizing = false;
    let startX;
    let startY;
    let initialLeft;
    let initialTop;
    let initialWidth;
    let initialHeight;
    let currentHandle = null;

    // Add click event to show/hide controls
    interactionContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      // 다른 이미지의 선택 해제
      document.querySelectorAll('[data-image-src]').forEach(el => {
        if (el !== mainContainer) {
          el.style.outline = 'none';
          el.querySelectorAll('[style*="cursor: nw-resize"]').forEach(control => {
            control.style.display = 'none';
          });
        }
      });
      // 현재 이미지 선택
      isSelected = true;
      mainContainer.style.outline = '2px solid #007bff';
      nwHandle.style.display = 'block';
      neHandle.style.display = 'block';
      swHandle.style.display = 'block';
      seHandle.style.display = 'block';
    });

    // Hide controls when clicking outside
    document.addEventListener('click', (e) => {
      if (!mainContainer.contains(e.target)) {
        isSelected = false;
        mainContainer.style.outline = 'none';
        nwHandle.style.display = 'none';
        neHandle.style.display = 'none';
        swHandle.style.display = 'none';
        seHandle.style.display = 'none';
      }
    });

    // 우클릭 메뉴 생성
    const createContextMenu = () => {
      const menu = document.createElement('div');
      menu.style.position = 'fixed';
      menu.style.backgroundColor = 'white';
      menu.style.border = '1px solid #ccc';
      menu.style.borderRadius = '4px';
      menu.style.padding = '8px 0';
      menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      menu.style.zIndex = '10000';
      menu.style.display = 'none';

      const deleteOption = document.createElement('div');
      deleteOption.textContent = '삭제';
      deleteOption.style.padding = '8px 16px';
      deleteOption.style.cursor = 'pointer';
      deleteOption.style.fontSize = '14px';
      deleteOption.style.color = '#d32f2f';

      deleteOption.addEventListener('mouseenter', () => {
        deleteOption.style.backgroundColor = '#f5f5f5';
      });

      deleteOption.addEventListener('mouseleave', () => {
        deleteOption.style.backgroundColor = 'transparent';
      });

      deleteOption.addEventListener('click', async () => {
        const images = await Storage.getImages();
        const updatedImages = images.filter(img => img.src !== image.src);
        await Storage.setImages(updatedImages);
        mainContainer.remove();
        menu.remove();
      });

      menu.appendChild(deleteOption);
      return menu;
    };

    const contextMenu = createContextMenu();
    document.body.appendChild(contextMenu);

    // 우클릭 이벤트
    interactionContainer.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 이미지 선택
      isSelected = true;
      mainContainer.style.outline = '2px solid #007bff';
      
      // 메뉴 위치 설정
      contextMenu.style.left = e.clientX + 'px';
      contextMenu.style.top = e.clientY + 'px';
      contextMenu.style.display = 'block';
    });

    // 메뉴 외부 클릭 시 메뉴 숨기기
    document.addEventListener('click', (e) => {
      if (!contextMenu.contains(e.target)) {
        contextMenu.style.display = 'none';
      }
    });

    // Del 키 이벤트 리스너
    const handleDeleteKey = async (e) => {
      if (e.key === 'Delete' && isSelected) {
        const images = await Storage.getImages();
        const updatedImages = images.filter(img => img.src !== image.src);
        await Storage.setImages(updatedImages);
        mainContainer.remove();
        document.removeEventListener('keydown', handleDeleteKey);
      }
    };
    document.addEventListener('keydown', handleDeleteKey);

    function dragStart(e) {
      if (e.target === interactionContainer) {
        console.log("ImageManager dragStart");
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        
        startX = e.clientX;
        startY = e.clientY;
        
        initialLeft = parseInt(mainContainer.style.left);
        initialTop = parseInt(mainContainer.style.top);

        mainContainer.style.transition = 'none';
      }
    }

    function resizeStart(e) {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      currentHandle = e.target;
      
      startX = e.clientX;
      startY = e.clientY;
      
      initialLeft = parseInt(mainContainer.style.left);
      initialTop = parseInt(mainContainer.style.top);
      initialWidth = parseInt(img.style.width);
      initialHeight = parseInt(img.style.height);

      mainContainer.style.transition = 'none';
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        requestAnimationFrame(() => {
          mainContainer.style.left = `${initialLeft + dx}px`;
          mainContainer.style.top = `${initialTop + dy}px`;
        });
      }
    }

    function resize(e) {
      if (isResizing) {
        e.preventDefault();
        e.stopPropagation();
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        
        let newWidth = initialWidth;
        let newHeight = initialHeight;
        let newLeft = initialLeft;
        let newTop = initialTop;

        switch(currentHandle) {
          case nwHandle:
            newWidth = initialWidth - dx;
            newHeight = newWidth / aspectRatio;
            newLeft = initialLeft + dx;
            newTop = initialTop + (initialHeight - newHeight);
            break;
          case neHandle:
            newWidth = initialWidth + dx;
            newHeight = newWidth / aspectRatio;
            newTop = initialTop + (initialHeight - newHeight);
            break;
          case swHandle:
            newWidth = initialWidth - dx;
            newHeight = newWidth / aspectRatio;
            newLeft = initialLeft + dx;
            break;
          case seHandle:
            newWidth = initialWidth + dx;
            newHeight = newWidth / aspectRatio;
            break;
        }

        // 최소 크기 제한
        if (newWidth >= 50 && newHeight >= 50) {
          requestAnimationFrame(() => {
            img.style.width = `${newWidth}px`;
            img.style.height = `${newHeight}px`;
            visualContainer.style.width = `${newWidth}px`;
            visualContainer.style.height = `${newHeight}px`;
            interactionContainer.style.width = `${newWidth}px`;
            interactionContainer.style.height = `${newHeight}px`;
            mainContainer.style.left = `${newLeft}px`;
            mainContainer.style.top = `${newTop}px`;
          });
        }
      }
    }

    function dragEnd(e) {
      if (!isDragging && !isResizing) return;
      
      e.stopPropagation();
      isDragging = false;
      isResizing = false;
      currentHandle = null;

      mainContainer.style.transition = 'all 0.1s ease-out';

      // Save the new position and size
      (async () => {
        try {
          const images = await Storage.getImages();
          const index = images.findIndex(img => img.src === image.src);
          if (index !== -1) {
            // 정확한 위치와 크기 값을 저장
            images[index].x = parseFloat(mainContainer.style.left);
            images[index].y = parseFloat(mainContainer.style.top);
            images[index].width = parseFloat(img.style.width);
            images[index].height = parseFloat(img.style.height);
            await Storage.setImages(images);
          }
        } catch (error) {
          console.error('이미지 저장 중 오류 발생:', error);
        }
      })();
    }

    interactionContainer.addEventListener('pointerdown', dragStart);
    [nwHandle, neHandle, swHandle, seHandle].forEach(handle => {
      handle.addEventListener('pointerdown', resizeStart);
    });
    document.addEventListener('pointermove', (e) => {
      drag(e);
      resize(e);
    });
    document.addEventListener('pointerup', dragEnd);
    document.addEventListener('pointercancel', dragEnd);

    // Add elements to containers
    visualContainer.appendChild(img);
    interactionContainer.appendChild(nwHandle);
    interactionContainer.appendChild(neHandle);
    interactionContainer.appendChild(swHandle);
    interactionContainer.appendChild(seHandle);
    
    mainContainer.appendChild(visualContainer);
    mainContainer.appendChild(interactionContainer);
    
    // Add to app
    this.$app.appendChild(mainContainer);
  }

  eventListeners() {
    // Add drop event listener
    this.$app.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.$app.addEventListener('drop', async (e) => {
      e.preventDefault();
      
      // 이미지 컨테이너 내부에서 발생한 드롭 이벤트는 무시
      if (e.target.closest('[data-image-src]')) {
        return;
      }
      
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

    // Copy and paste event listeners
    document.addEventListener('keydown', async (e) => {
      // Ctrl + C: 이미지 복사
      if (e.ctrlKey && e.key === 'c') {
        const selectedImage = document.querySelector('[data-image-src] button[style*="display: block"]')?.parentElement;
        if (selectedImage) {
          const imageSrc = selectedImage.dataset.imageSrc;
          const images = await Storage.getImages();
          const imageData = images.find(img => img.src === imageSrc);
          if (imageData) {
            this.copiedImage = { ...imageData };
          }
        }
      }
      
      // Ctrl + V: 이미지 붙여넣기
      if (e.ctrlKey && e.key === 'v' && this.copiedImage) {
        const newImage = {
          ...this.copiedImage,
          x: this.copiedImage.x + 20, // 원본 이미지에서 약간 오프셋
          y: this.copiedImage.y + 20
        };
        await Storage.addImage(newImage);
        this.createImageElement(newImage);
      }
    });
  }
} 