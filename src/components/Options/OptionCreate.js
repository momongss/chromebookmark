import { selectAll } from "../../utils/caret.js";
import { constDatas } from "../../utils/const.js";
import Storage from "../../utils/storage.js";

export default class OptionCreate {
  constructor({ $app, $target, x, y, mode }) {
    const $createOptions = document.createElement("div");
    $createOptions.className = "options create";
    $createOptions.innerHTML = `
          <div class="button create-folder"><img src="chrome-extension://${chrome.runtime.id}/assets/add.svg" /></div>
          <div class="button create-postit"><img src="chrome-extension://${chrome.runtime.id}/assets/postit-icon.svg" /></div>
        `;

    this.$createOptions = $createOptions;
    this.$createOptions.style.display = "flex";
    this.$createOptions.style.top = `${y}px`;
    this.$createOptions.style.left = `${x}px`;

    document.body.appendChild($createOptions);

    // 새폴더 생성 버튼
    const createFolderBtn = $createOptions.querySelector('.create-folder');
    createFolderBtn.addEventListener("click", (e) => {
      const bookMark = { id: 0, title: "", children: [] };

      const tmp = $target.className.split("-");
      const pos = { x: parseInt(tmp[2]), y: parseInt(tmp[3]) };

      const newFolder = document.createElement("folder-node");
      newFolder.Init({
        $parent: $target,
        bookMark: bookMark,
      });

  const $text = newFolder.$node.querySelector(".text");
  // 즉시 이름 편집 가능하도록 설정
  $text.contentEditable = true;
  $text.classList.add('edit');
  $text.focus();
  selectAll($text);
      $text.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          $text.blur();
        }
      });

      $text.addEventListener("blur", (e) => {
        // 편집 종료 상태 복원
        $text.contentEditable = false;
        $text.classList.remove('edit');
        const parentId = $target.dataset.id
          ? $target.dataset.id
          : constDatas.rootId;
        const title = ($text.textContent || $text.innerText || '').trim() || '새 폴더';

        chrome.bookmarks.create(
          {
            title: title,
            parentId: parentId,
          },
          (created) => {
            try {
              // 위치 저장
              Storage.setPos(created.id, pos);
              // 생성된 정보로 노드 데이터 갱신 후 재렌더
              newFolder.bookMark = created;
              newFolder.render();
              // 텍스트 표시 갱신
              const t = newFolder.$node.querySelector('.text');
              if (t) t.textContent = title;
              // 새로 생성된 폴더 요소에 포커스를 두지 않고 메뉴만 닫음
            } catch (err) {
              console.error('폴더 생성 후 렌더링 실패:', err);
            }
          }
        );
      });
    });

    // 포스트잇 생성 버튼
    const createPostItBtn = $createOptions.querySelector('.create-postit');
    createPostItBtn.addEventListener("click", (e) => {
      // 포스트잇 매니저가 있는지 확인하고 생성
      if (window.postItManager) {
        window.postItManager.createPostIt(x, y);
      } else {
        // 포스트잇 매니저가 없으면 직접 생성
        this.createPostItDirectly(x, y);
      }
    });
  }

  async createPostItDirectly(x, y) {
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

    // Storage에 저장
    const postIts = await Storage.getPostIts();
    postIts.push(newPostIt);
    await Storage.setPostIts(postIts);

    // DOM에 생성
    const postItElement = document.createElement('div');
    postItElement.className = 'post-it';
    postItElement.dataset.postItId = newPostIt.id;
    postItElement.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${newPostIt.width}px;
      height: ${newPostIt.height}px;
      background: ${newPostIt.color};
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

    // 헤더 생성
    const header = document.createElement('div');
    header.className = 'post-it-header';
    header.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
      cursor: move;
      z-index: 10;
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
        const postIts = await Storage.getPostIts();
        const updatedPostIts = postIts.filter(p => p.id !== newPostIt.id);
        await Storage.setPostIts(updatedPostIts);
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
      colorOption.addEventListener('click', async () => {
        postItElement.style.background = color;
        newPostIt.color = color;
        const postIts = await Storage.getPostIts();
        const index = postIts.findIndex(p => p.id === newPostIt.id);
        if (index !== -1) {
          postIts[index] = newPostIt;
          await Storage.setPostIts(postIts);
        }
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

    const content = document.createElement('div');
    content.className = 'post-it-content';
    content.contentEditable = true;
    content.textContent = newPostIt.content;
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
      padding: 8px;
      user-select: text;
    `;

    // 엔터 키 처리
    content.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertLineBreak', false, null);
      }
    });

    // 내용 변경 시 저장
    content.addEventListener('input', async () => {
      newPostIt.content = content.textContent;
      const postIts = await Storage.getPostIts();
      const index = postIts.findIndex(p => p.id === newPostIt.id);
      if (index !== -1) {
        postIts[index] = newPostIt;
        await Storage.setPostIts(postIts);
      }
    });

    postItElement.appendChild(header);
    postItElement.appendChild(content);
    document.body.appendChild(postItElement);

    // 호버 시 헤더 표시
    postItElement.addEventListener('mouseenter', () => {
      header.style.opacity = '1';
    });

    postItElement.addEventListener('mouseleave', () => {
      header.style.opacity = '0';
      colorPalette.style.display = 'none';
    });

    // 포커스 설정
    setTimeout(() => {
      content.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(content);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }, 100);
  }
}
