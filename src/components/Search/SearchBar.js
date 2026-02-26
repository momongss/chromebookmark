import bookmarkManager from "../../utils/bookmark.js";
import { ConstText } from "../../utils/const.js";
import Storage from "../../utils/storage.js";
import FolderManager from "../FolderManager.js";

export default class SearchBar {
  constructor(app) {
    this.app = app; // App instance or App.$dom
    this.isVisible = false;
    this._build();
    this._installHandlers();
  }

  _build() {
    this.$root = document.createElement('div');
    this.$root.className = 'bookmark-search-bar';
    this.$root.style.cssText = [
      'position:fixed',
      'left:0','right:0','top:0',
      'display:flex',
      'align-items:flex-start',
      'pointer-events:none',
      'transform: translateY(-100%)',
      'transition: transform 0.2s ease',
      'z-index:12000',
      'padding: 12px 16px'
    ].join(';');

    const $container = document.createElement('div');
    $container.style.cssText = [
      'width:640px',
      'margin:0 auto',
      'display:flex',
      'flex-direction:column',
      'pointer-events:auto',
      'padding:6px',
      'background:rgba(245, 245, 250, 0.82)',
      'backdrop-filter:blur(28px) saturate(1.6)',
      '-webkit-backdrop-filter:blur(28px) saturate(1.6)',
      'border-radius:18px',
      'border:1.5px solid rgba(255,255,255,0.5)',
      'box-shadow:0 0 0 1px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.12), 0 0 80px rgba(130,100,255,0.06)'
    ].join(';');

    const $row = document.createElement('div');
    $row.style.cssText = 'display:flex;align-items:center;gap:10px';

    const $icon = document.createElement('span');
    $icon.textContent = '🔎';
    $icon.style.cssText = 'font-size:18px;opacity:0.45;flex-shrink:0';

    this.$input = document.createElement('input');
    this.$input.type = 'text';
    this.$input.placeholder = ConstText.BOOKMARK_SEARCH_PLACEHOLDER || '북마크 검색...';
    this.$input.className = 'bookmark-search-input';
    this.$input.style.cssText = [
      'flex:1',
      'margin:0',
      'padding:12px 14px',
      'font-size:15px',
      'border-radius:12px',
      'background:transparent',
      'border:none',
      'outline:none',
      'color:#1a1a2e',
      'caret-color:#7c5cfc',
      'font-weight:500',
      'letter-spacing:0.2px'
    ].join(';');
    this.$input.addEventListener('focus', () => {
      $container.style.borderColor = 'rgba(124,92,252,0.4)';
      $container.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.12), 0 0 0 3px rgba(124,92,252,0.12)';
    });
    this.$input.addEventListener('blur', () => {
      $container.style.borderColor = 'rgba(255,255,255,0.5)';
      $container.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.12), 0 0 80px rgba(130,100,255,0.06)';
    });


    $row.appendChild($icon);
    $row.appendChild(this.$input);

  this.$results = document.createElement('div');
  this.$results.className = 'bookmark-search-results';
  this.$results.style.cssText = 'display:none;max-height:50vh;overflow:auto;border-radius:12px;border-top:1px solid rgba(0,0,0,0.06)';

    $container.appendChild($row);
    $container.appendChild(this.$results);
    this.$root.appendChild($container);
    document.body.appendChild(this.$root);
  }

  _installHandlers() {
    this._onInput = this._debounce(async () => {
      const q = this.$input.value.trim();
      if (!q) { this._hideResults(); return; }
      try {
        const results = await this._searchBookmarks(q);
        this._renderResults(results.slice(0, 50));
      } catch (e) {
        console.error('검색 실패:', e);
      }
    }, 200);

    this.$input.addEventListener('input', this._onInput);

    // 키보드 내비게이션
    this.$input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.hide(); return; }
      const items = Array.from(this.$results.querySelectorAll('.search-item'));
      if (!items.length) return;
      const current = this.$results.querySelector('.search-item.active');
      let idx = items.indexOf(current);
      if (e.key === 'ArrowDown') { e.preventDefault(); idx = (idx + 1) % items.length; this._activate(items[idx]); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); idx = (idx - 1 + items.length) % items.length; this._activate(items[idx]); }
      else if (e.key === 'Enter') { e.preventDefault(); (current || items[0])?.click(); }
    });
  }

  async _searchBookmarks(query) {
    return new Promise((resolve, reject) => {
      try {
        chrome.bookmarks.search(query, (nodes) => resolve(nodes || []));
      } catch (e) { reject(e); }
    });
  }

  _renderResults(nodes) {
    this.$results.style.display = 'block';
    this.$results.innerHTML = '';
    if (!nodes || nodes.length === 0) {
      const empty = document.createElement('div');
      empty.textContent = ConstText.NO_SEARCH_RESULT || '검색 결과가 없습니다.';
      empty.style.cssText = 'padding:12px 14px;color:rgba(0,0,0,0.35);font-size:13px';
      this.$results.appendChild(empty);
      return;
    }
    for (const n of nodes) {
      const $item = document.createElement('div');
      $item.className = 'search-item';
      $item.style.cssText = 'display:flex;gap:8px;align-items:center;padding:9px 14px;cursor:pointer;border-radius:10px;margin:2px 4px;transition:background 0.1s';
      const isFolder = !n.url;
      const icon = document.createElement('span');
      icon.textContent = isFolder ? '📁' : '🔗';

      const $info = document.createElement('div');
      $info.style.cssText = 'flex:1;min-width:0;display:flex;flex-direction:column;gap:2px';

      const title = document.createElement('div');
      title.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;color:#1a1a2e;font-weight:500';
      title.textContent = n.title || (isFolder ? '(폴더)' : n.url);

      const $path = document.createElement('div');
      $path.style.cssText = 'font-size:11px;color:rgba(0,0,0,0.35);white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      $path.textContent = '...';
      this._getBookmarkPath(n.parentId).then(path => { $path.textContent = path; });

      $info.appendChild(title);
      $info.appendChild($path);

      const meta = document.createElement('div');
      meta.style.cssText = 'font-size:11px;color:rgba(0,0,0,0.25);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:35%';
      meta.textContent = isFolder ? 'Folder' : (n.url || '');

      $item.appendChild(icon); $item.appendChild($info); $item.appendChild(meta);

      if (!isFolder) {
        const $locBtn = document.createElement('button');
        $locBtn.textContent = ConstText.OPEN_LOCATION // '위치 열기';
        $locBtn.title = '이 북마크가 있는 위치 열기';
        $locBtn.style.cssText = 'margin-left:4px;padding:5px 10px;border:1px solid rgba(0,0,0,0.08);border-radius:8px;background:rgba(124,92,252,0.06);color:#7c5cfc;font-size:11px;cursor:pointer;flex:0 0 auto;transition:background 0.1s;font-weight:500';
        $locBtn.addEventListener('mouseenter', () => { $locBtn.style.background = 'rgba(124,92,252,0.12)'; });
        $locBtn.addEventListener('mouseleave', () => { $locBtn.style.background = 'rgba(124,92,252,0.06)'; });
        $locBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._openLocation(n).catch(err => console.error('위치 열기 실패:', err));
        });
        $item.appendChild($locBtn);
      }

      $item.addEventListener('mouseenter', () => this._activate($item));
      $item.addEventListener('click', (e) => {
        if (isFolder) {
          this._openFolderManager(n.id);
        } else if (n.url) {
          window.location.href = n.url;
        }
        this.hide();
      });
      this.$results.appendChild($item);
    }
    this._activate(this.$results.querySelector('.search-item'));
  }

  _activate(el) {
    this.$results.querySelectorAll('.search-item').forEach(x => { x.classList.remove('active'); x.style.background = ''; });
    if (el) {
      el.classList.add('active');
      el.style.background = 'rgba(124,92,252,0.08)';
    }
  }

  _openFolderManager(folderId) {
    const initPos = { left: Math.max(20, window.innerWidth/2 - 220), top: 80 };
    const fm = document.createElement('folder-manager');
    fm.initWithHistory({ id: folderId, initPos, onDestroy: () => {} });
    return fm;
  }

  show() {
    this.isVisible = true;
    this.$root.style.transform = 'translateY(0)';
    setTimeout(() => {
      this.$input.focus();
      this._bindOutsideClose();
      this._hideResults();
    }, 0);
  }
  hide() {
    this.isVisible = false;
    this.$root.style.transform = 'translateY(-100%)';
    this.$input.value = '';
    this._hideResults();
    this._unbindOutsideClose();
  }
  isOpen() { return this.isVisible; }

  _debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
  }

  async _openLocation(node) {
    // 파일(북마크)만 처리
    if (!node || !node.id || !node.url) return;
    const id = node.id;

    try {
      // 최신 부모 정보 조회 (Storage에 남아있는 과거 위치로 판단하지 않음)
      const fresh = await bookmarkManager.getNode(id);
      const parentId = fresh?.parentId || node.parentId;
      if (!parentId) return;

      // 바탕화면(북마크 바: id "1")에 있는 경우 폴더를 열지 않고 강조만 수행
      if (String(parentId) === '1') {
        this._highlightBookmark(id, document);
        return;
      }

      // 폴더 내부인 경우 해당 폴더를 열고 강조
      const fm = this._openFolderManager(parentId);
      this._retry(() => this._highlightBookmark(id, fm), 6, 140);
    } catch (e) {
      console.error(e);
    }
  }

  _highlightBookmark(id, root=document) {
    if (!id) return false;
    // 앵커 요소가 데이터 속성으로 id를 가지고 있음
    const anchor = root.querySelector(`[data-id="${CSS.escape(String(id))}"]`);
    if (!anchor) return false;
    const target = anchor.closest('.node') || anchor;
    // 강조 스타일 적용 후 잠시 뒤 제거
    const prevTransition = target.style.transition;
    const prevOutline = target.style.outline;
    const prevBoxShadow = target.style.boxShadow;
    const prevBorderRadius = target.style.borderRadius;
    target.style.transition = 'outline-color 0.2s ease, box-shadow 0.2s ease';
    target.style.outline = '2px solid #0b82ff';
    target.style.borderRadius = '10px';
    target.style.boxShadow = '0 0 0 4px rgba(11,130,255,0.18)';
    // 가시성 확보를 위한 스크롤(폴더매니저 내부 스크롤 포함)
    try { target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }); } catch {}
    setTimeout(() => {
      target.style.outline = prevOutline;
      target.style.boxShadow = prevBoxShadow;
      target.style.borderRadius = prevBorderRadius;
      target.style.transition = prevTransition;
    }, 1800);
    return true;
  }

  _retry(fn, tries=5, delay=100) {
    let count = 0;
    const attempt = () => {
      count++;
      const ok = fn();
      if (ok) return;
      if (count >= tries) return;
      setTimeout(attempt, delay);
    };
    attempt();
  }

  _bindOutsideClose() {
    if (this._outsideHandler) return;
    this._outsideHandler = (e) => {
      // SearchBar 영역 밖 클릭 시 닫기
      if (!this.$root.contains(e.target)) {
        this.hide();
      }
    };
    // 캡처 단계에서 받아 빠르게 처리 (내부 클릭은 contains로 무시)
    document.addEventListener('mousedown', this._outsideHandler, { capture: true });
    document.addEventListener('touchstart', this._outsideHandler, { capture: true });
  }

  _unbindOutsideClose() {
    if (!this._outsideHandler) return;
    document.removeEventListener('mousedown', this._outsideHandler, { capture: true });
    document.removeEventListener('touchstart', this._outsideHandler, { capture: true });
    this._outsideHandler = null;
  }

  _hideResults() {
    if (this.$results) {
      this.$results.style.display = 'none';
      this.$results.innerHTML = '';
    }
  }

  async _getBookmarkPath(parentId) {
    const parts = [];
    let currentId = parentId;
    try {
      while (currentId && currentId !== '0') {
        const node = await bookmarkManager.getNode(currentId);
        if (!node) break;
        if (node.title) parts.unshift(node.title);
        currentId = node.parentId;
      }
    } catch (e) { /* ignore */ }
    return parts.length ? parts.join(' / ') : '/';
  }
}
