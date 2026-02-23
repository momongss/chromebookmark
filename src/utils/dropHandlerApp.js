import Storage from "./storage.js";
import Bookmark from "./bookmark.js";
import { findNearbyEmptyWrapperAround } from "./utils.js";

export default class DropHandlerApp {
    $parent;

    constructor($app) {
        this.$parent = $app;
        // 멀티 드래그 드롭 미리보기(각 노드 위치 표시) 관리용
        this.multiHoverWrappers = new Set();

        this.eventListeners();
    }

    eventListeners() {
        document.addEventListener("drop", this.onDrop);
        document.addEventListener("dragover", this.onDragOver);
        this.$parent.addEventListener("dragstart", this.onDragStart);
        this.$parent.addEventListener("drag", this.onDrag);
    }

    onDragStart = (e) => {
        // 드래그 시작 시 드래그된 객체 정보를 저장
        const draggedElement = e.target.closest('item-node, file-node, folder-node');
        if (draggedElement) {
            // 단일 드래그인 경우 (TempDragger가 활성화되지 않은 경우) 이전 멀티 선택 상태 완전 초기화
            if (!window.isTempDragActive) {
                
                // 모든 노드의 선택 상태 제거
                const allNodes = document.querySelectorAll('file-node, folder-node, item-node');
                allNodes.forEach(node => {
                    node.classList.remove('multi');
                    if (node.firstElementChild) {
                        node.firstElementChild.classList.remove('selected');
                    }
                    // 모든 임시 스타일 제거
                    node.style.opacity = '';
                    node.style.transform = '';
                    node.style.filter = '';
                    node.style.boxShadow = '';
                    node.style.position = '';
                    node.style.left = '';
                    node.style.top = '';
                    node.style.zIndex = '';
                    node.style.transition = '';
                    
                    // RectDragger 참조 제거
                    if (node.dragger) {
                        node.dragger = null;
                    }
                });
                
                // 모든 RectDragger의 선택 상태 초기화
                const rectDraggers = document.querySelectorAll('rect-dragger');
                rectDraggers.forEach(dragger => {
                    if (dragger.matchingElements) {
                        dragger.matchingElements = [];
                    }
                });
                
                // TempDragger도 완전히 비활성화
                const tempDraggers = document.querySelectorAll('temp-dragger');
                tempDraggers.forEach(tempDragger => {
                    if (tempDragger.disable) {
                        tempDragger.disable();
                    }
                    tempDragger.selectedElements = null;
                });
                
                // 전역 변수 초기화
                window.currentDragNodes = null;
                window.dragStartNode = null;
            }
            
            // dataTransfer에 드래그된 요소의 정보 저장
            e.dataTransfer.setData("text/plain", draggedElement.bookMark?.id || "");
            // 전역 변수로도 저장 (더 많은 정보 접근 가능)
            window.currentDraggedElement = draggedElement;
            
            // FolderManager 내에서 드래그가 발생한 경우 이벤트 전파 막기
            if (this.$parent.tagName === "FOLDER-MANAGER") {
                e.stopPropagation();
            }
        }
    }

    curHoverObj = null;

    onDragOver = (e) => {
        e.preventDefault(); // 드롭을 허용하기 위해 필요

        const isMultiDrag = window.isTempDragActive;
        const isInFolderManager = this.$parent.tagName === 'FOLDER-MANAGER';
        
        // 멀티 드래그의 경우 TempDragger를 무시하고 마우스 위치의 실제 요소를 찾음
        let targetElement = e.target;

        const folderNode = targetElement.closest('folder-node');
        const folderManager = targetElement.closest('folder-manager');

        // 드래그 중인 요소들이 자기 자신에게 호버되는 것 방지
        if (isMultiDrag && window.currentDragNodes) {
            const isDraggingSelf = window.currentDragNodes.some(node => 
                targetElement === node || node.contains(targetElement)
            );
            if (isDraggingSelf) return;
        }

        // node-wrapper 확인 (드래그오버용)
        let hoverNodeWrapper = null;
        if (targetElement.className && targetElement.className.includes("node-wrapper")) {
            hoverNodeWrapper = targetElement;
        } else {
            const parent = targetElement.closest('[class*="node-wrapper"]');
            if (parent && parent.className.includes("node-wrapper")) {
                hoverNodeWrapper = parent;
            }
        }
        
        // 폴더가 우선적으로 시각적으로 강조되도록: 분기 처리로 위임
        if (folderNode) {
            this.handleDragOverFolderNode(folderNode, isMultiDrag);
            return;
        }
        if (hoverNodeWrapper) {
            this.handleDragOverWrapper(targetElement, hoverNodeWrapper, isMultiDrag, isInFolderManager);
            return;
        }
        if (folderManager) {
            this.handleDragOverFolderManager(folderManager);
            return;
        }

        // 기타 영역: 상태 정리
        if (this.curHoverObj) {
            this.curHoverObj.classList.remove("hover", "hover-occupied");
            this.curHoverObj = null;
        }
        this.clearMultiHover();
    }

    // 폴더 노드 위 드래그오버 처리
    handleDragOverFolderNode(folderNode, isMultiDrag) {
        // 멀티 드래그 시 드래그 중인 폴더에는 호버 효과 주지 않음
        if (isMultiDrag && window.currentDragNodes && window.currentDragNodes.includes(folderNode)) {
            return;
        }
        this.clearMultiHover();
        folderNode.classList.add("hover");
        if (this.curHoverObj && this.curHoverObj != folderNode) {
            this.curHoverObj.classList.remove("hover", "hover-occupied");
        }
        this.curHoverObj = folderNode;
    }

    // 폴더 매니저 위 드래그오버 처리
    handleDragOverFolderManager(folderManager) {
        this.clearMultiHover();
        folderManager.classList.add("hover");
        if (this.curHoverObj && this.curHoverObj != folderManager) {
            this.curHoverObj.classList.remove("hover", "hover-occupied");
        }
        this.curHoverObj = folderManager;
    }

    // 바탕 그리드 래퍼 위 드래그오버 처리 + 멀티 미리보기
    handleDragOverWrapper(targetElement, hoverNodeWrapper, isMultiDrag, isInFolderManager) {
        // 기존 호버/미리보기 정리
        if (this.curHoverObj && this.curHoverObj != hoverNodeWrapper) {
            this.curHoverObj.classList.remove("hover", "hover-occupied");
        }

        // 점유 여부 표시
        const hasExistingNodes = Array.from(hoverNodeWrapper.children).some(child =>
            child.tagName && (child.tagName.includes('NODE') || child.tagName.includes('node')) &&
            (!isMultiDrag || !window.currentDragNodes.includes(child))
        );
        if (hasExistingNodes) {
            hoverNodeWrapper.classList.add("hover-occupied");
        } else {
            hoverNodeWrapper.classList.add("hover");
        }
        this.curHoverObj = hoverNodeWrapper;

        // 멀티 드래그 미리보기 (App에서만)
        if (isMultiDrag && !isInFolderManager) {
            let baseWrapper = hoverNodeWrapper;
            if (!baseWrapper) {
                const parent = targetElement.closest('[class*="node-wrapper"]');
                if (parent && parent.className.includes('node-wrapper')) baseWrapper = parent;
            }
            if (baseWrapper && Array.isArray(window.currentDragNodes) && window.currentDragNodes.length) {
                this.clearMultiHover();
                const { x: dropX, y: dropY } = this.parseWrapperCoords(baseWrapper);
                const anchor = window.dragStartNode || window.currentDragNodes[0];
                const plans = this.computeAnchoredTargets(window.currentDragNodes, anchor, dropX, dropY);
                plans.forEach(plan => {
                    const preferred = this.$parent.querySelector(`.node-wrapper-${plan.targetX}-${plan.targetY}`);
                    if (!preferred) return;
                    const children = Array.from(preferred.children).filter(c => c.tagName && (c.tagName.includes('NODE') || c.tagName.includes('node')));
                    const occupiedByOthers = children.some(c => !window.currentDragNodes.includes(c));
                    if (plan.element === anchor) {
                        preferred.classList.add('multi-target-anchor');
                    }
                    preferred.classList.add(occupiedByOthers ? 'multi-target-occupied' : 'multi-target');
                    this.multiHoverWrappers.add(preferred);
                });
            } else {
                this.clearMultiHover();
            }
        } else {
            this.clearMultiHover();
        }
    }

    onDrop = (e) => {
        e.preventDefault();

        
        
        // FolderManager 내에서 drop이 발생한 경우 이벤트 전파 막기
        if (this.$parent.tagName === "FOLDER-MANAGER") {
            e.stopPropagation();
        }

        if (this.curHoverObj) {
            this.curHoverObj.classList.remove("hover", "hover-occupied");
            this.curHoverObj = null;
        }
        // 멀티 드롭 미리보기 정리
        this.clearMultiHover();
        
        // 멀티 드래그인지 확인
        const isMultiDrag = window.isTempDragActive && window.currentDragNodes;
        
        // 드롭된 위치에서 상위로 탐색하여 해당하는 요소들 찾기
        // 멀티 드래그의 경우 TempDragger를 무시하고 마우스 위치의 실제 요소를 찾음
        let targetElement = e.target;
        if (isMultiDrag) {
            // TempDragger 아래의 실제 요소를 찾기 위해 elementsFromPoint 사용
            const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
            
            // 드래그 관련 요소들과 선택된 요소들을 제외하고 실제 드롭 대상 찾기
            const validTarget = elementsAtPoint.find(el => 
                el.tagName !== 'TEMP-DRAGGER' && 
                !el.classList.contains('drag-preview') &&
                !el.classList.contains('drag-overlay') &&
                !el.classList.contains('multi') &&
                !window.currentDragNodes.includes(el)
            );
            
            if (validTarget) {
                targetElement = validTarget;
            } else {
            }
        }
        
        // node-wrapper 감지 개선
        let nodeWrapper = null;
        if (targetElement.className && targetElement.className.includes("node-wrapper")) {
            nodeWrapper = targetElement;
        } else {
            // 상위 요소에서 node-wrapper 찾기
            const parent = targetElement.closest('[class*="node-wrapper"]');
            if (parent && parent.className.includes("node-wrapper")) {
                nodeWrapper = parent;
            }
        }
        const folderNode = targetElement.closest('folder-node');
        const folderManager = targetElement.closest('folder-manager');
        
        // 멀티 드래그인지 단일 드래그인지 확인
        const draggedElements = isMultiDrag ? window.currentDragNodes : [window.currentDraggedElement];

        // 드롭 처리 (폴더 우선 처리: 폴더 위로 드롭하면 폴더 안으로 이동)
        let dropSuccessful = false;
        if (draggedElements.length > 0 && draggedElements[0]) {
            if (folderNode && !draggedElements.includes(folderNode)) {
                this.handleDropToFolder(folderNode, draggedElements, isMultiDrag);
                dropSuccessful = true;
            } else if (nodeWrapper) {
                this.handleDropToNodeWrapper(nodeWrapper, draggedElements, isMultiDrag);
                dropSuccessful = true;
            } else if (folderManager) {
                this.handleDropToFolderManager(folderManager, draggedElements, isMultiDrag);
                dropSuccessful = true;
            } else {
                
            }
        } else {
        }

        // 정리
        if (isMultiDrag) {
            const tempDragger = document.querySelector('temp-dragger');
            if (tempDragger) {
                if (dropSuccessful) {
                    tempDragger.markDropSuccessful();
                } else {
                }
            }
        }
        window.currentDraggedElement = null;
    }

    // 멀티 드래그 드롭 위치 표시 정리
    clearMultiHover() {
        if (!this.multiHoverWrappers || this.multiHoverWrappers.size === 0) return;
        this.multiHoverWrappers.forEach(w => {
            w.classList.remove('multi-target', 'multi-target-occupied', 'multi-target-anchor');
        });
        this.multiHoverWrappers.clear();
    }

    // 노드 래퍼(바탕화면 그리드)에 드롭 처리
    handleDropToNodeWrapper(nodeWrapper, draggedElements, isMultiDrag) {
        
        
        try {
            if (isMultiDrag) {
                // 멀티 드래그: 드래그 시작 노드를 드롭 위치에 배치하고, 나머지는 상대적 오프셋 유지
                const { x: dropX, y: dropY } = this.parseWrapperCoords(nodeWrapper);
                
                // 드래그 시작 노드 찾기
                const dragStartNode = window.dragStartNode || draggedElements[0];
                const plans = this.computeAnchoredTargets(draggedElements, dragStartNode, dropX, dropY);
                
                // 1) 앵커(시작 노드) 먼저 배치
                const anchorPlan = plans.find(p => p.element === dragStartNode) || plans[0];
                const anchorWrapper = this.$parent.querySelector(`.node-wrapper-${anchorPlan.targetX}-${anchorPlan.targetY}`);
                if (!anchorWrapper) {
                    draggedElements.forEach(el => el.originalParent && el.ReInit({ $parent: el.originalParent }));
                    return;
                }
                const anchorOk = this.placeElementWithCollisionHandling(anchorPlan.element, anchorWrapper, anchorPlan.targetX, anchorPlan.targetY);
                if (!anchorOk) {
                    draggedElements.forEach(el => el.originalParent && el.ReInit({ $parent: el.originalParent }));
                    return;
                }
                
                // 2) 나머지 요소 배치
                for (const plan of plans) {
                    if (plan.element === anchorPlan.element) continue;
                    const preferred = this.$parent.querySelector(`.node-wrapper-${plan.targetX}-${plan.targetY}`);
                    let targetWrapper = null;
                    if (preferred) {
                        const isMulti = window.isTempDragActive && Array.isArray(window.currentDragNodes);
                        const children = Array.from(preferred.children).filter(c => c.tagName && (c.tagName.includes('NODE') || c.tagName.includes('node')));
                        const allChildrenAreSelected = isMulti && children.length > 0 && children.every(c => window.currentDragNodes.includes(c));
                        if (children.length === 0 || allChildrenAreSelected) {
                            targetWrapper = preferred;
                        }
                    }
                    if (!targetWrapper) {
                        targetWrapper = findNearbyEmptyWrapperAround(this.$parent, plan.targetX, plan.targetY);
                    }
                    if (targetWrapper) {
                        const { x: wrapperX, y: wrapperY } = this.parseWrapperCoords(targetWrapper);
                        const ok = this.placeElementWithCollisionHandling(plan.element, targetWrapper, wrapperX, wrapperY);
                        if (!ok) {
                            plan.element.ReInit({ $parent: plan.element.originalParent });
                        }
                    } else {
                        plan.element.ReInit({ $parent: plan.element.originalParent });
                    }
                }
            } else {
                // 단일 드래그
                const element = draggedElements[0];
                const { x: targetX, y: targetY } = this.parseWrapperCoords(nodeWrapper);
                
                const success = this.placeElementWithCollisionHandling(element, nodeWrapper, targetX, targetY);
                if (!success) {
                } else {
                }
            }
            
        } catch (error) {
            console.error("노드 래퍼 드롭 처리 중 오류:", error);
        }
    }

    // 폴더 노드에 드롭 처리
    handleDropToFolder(folderNode, draggedElements, isMultiDrag) {
        
        
        draggedElements.forEach(element => {
            if (element !== folderNode && element.bookMark) {
                
                // 북마크를 폴더 안으로 이동
                folderNode.addItem(element.bookMark);
                
                // DOM에서 요소 제거
                element.remove();
                
            }
        });
    }

    // 폴더 매니저에 드롭 처리
    handleDropToFolderManager(folderManager, draggedElements, isMultiDrag) {
        
        
        draggedElements.forEach(element => {
            if (element && element.bookMark) {
                folderManager.addItem(element.bookMark);
                element.remove();
            }
        });
    }

    // 충돌 처리와 함께 요소 배치
    placeElementWithCollisionHandling(element, targetWrapper, targetX, targetY) {
        
        
        // 타겟 위치에 이미 다른 노드가 있는지 확인 (자기 자신 제외)
        const isMulti = window.isTempDragActive && Array.isArray(window.currentDragNodes);
        const existingNodes = Array.from(targetWrapper.children).filter(child => 
            child.tagName && (child.tagName.includes('NODE') || child.tagName.includes('node')) &&
            child !== element &&
            !(isMulti && window.currentDragNodes.includes(child)) // 멀티 선택된 노드는 충돌로 보지 않음
        );
        
        if (existingNodes.length > 0) {
            
            // 이동을 취소하고 원래 위치로 복원
            if (element.originalParent) {
                element.ReInit({ $parent: element.originalParent });
            } else {
                console.warn(`원래 위치를 찾을 수 없음, 빈 공간으로 이동 시도`);
                const emptyWrapper = this.findAnyEmptyWrapper();
                if (emptyWrapper) {
                    element.ReInit({ $parent: emptyWrapper });
                } else {
                    console.error(`빈 공간도 없음, 이동 실패`);
                }
            }
            
            return false; // 이동 실패를 나타냄
        }
        
        // 타겟 위치가 멀티 선택 노드로만 점유된 경우, 해당 노드들을 우선 분리하여 중첩 방지
        if (isMulti) {
            const selectedChildren = Array.from(targetWrapper.children).filter(child => 
                child.tagName && (child.tagName.includes('NODE') || child.tagName.includes('node')) &&
                window.currentDragNodes.includes(child) && child !== element
            );
            if (selectedChildren.length > 0) {
                console.log(`타겟 위치가 선택된 노드로 점유됨 — 임시 분리 후 배치 계속`);
                selectedChildren.forEach(ch => ch.remove());
            }
        }
        
        // 새 요소를 타겟 위치에 배치 (충돌 없음)
        
        element.ReInit({ $parent: targetWrapper });
        return true; // 이동 성공을 나타냄
    }

    // 전체 그리드에서 빈 공간 찾기
    findAnyEmptyWrapper() {
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 20; x++) {
                const wrapper = this.$parent.querySelector(`.node-wrapper-${x}-${y}`);
                if (wrapper && wrapper.childElementCount === 0) {
                    return wrapper;
                }
            }
        }
        return null;
    }

    // 지정된 목표 좌표 주변의 빈 공간 찾기(요소별 중심 탐색)
    findNearbyEmptyWrapperAround(centerX, centerY) {
        const directions = [
            [1, 0], [0, 1], [-1, 0], [0, -1],
            [1, 1], [-1, 1], [1, -1], [-1, -1]
        ];
        return null; // moved to utils.js
    }

    // 요소의 현재 그리드 위치를 반환
    getElementGridPosition(element) {
        const parent = element.parentElement;
        if (!parent || !parent.className.includes('node-wrapper')) {
            return null;
        }
        return this.parseWrapperCoords(parent);
    }

    // node-wrapper-*-* 클래스에서 좌표를 안전하게 파싱
    parseWrapperCoords(wrapperEl) {
        // classList에서 매칭되는 토큰을 찾음
        const classes = (wrapperEl.className || '').split(/\s+/);
        for (const cls of classes) {
            const m = cls.match(/^node-wrapper-(\d+)-(\d+)$/);
            if (m) {
                return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
            }
        }
        // 이전 방식과의 호환: 전체 문자열에서 마지막 숫자 2개 찾기
        const m = (wrapperEl.className || '').match(/node-wrapper-(\d+)-(\d+)/);
        if (m) {
            return { x: parseInt(m[1], 10), y: parseInt(m[2], 10) };
        }
        return { x: 0, y: 0 };
    }

    위치변환(meX, meY, anchorX, anchorY, dropX, dropY) {
        const x = dropX + (meX - anchorX);
        const y = dropY + (meY - anchorY);
        return { x, y };
    }

    // 멀티 드롭 좌표 변환: 앵커 기준 상대 오프셋을 보존해 타겟 좌표 생성
    computeAnchoredTargets(draggedElements, anchorElement, dropX, dropY) {
        // 원본 위치 스냅샷
        const posMap = new Map();
        draggedElements.forEach(el => {
            const p = el.originalPosition || this.getElementGridPosition(el);
            if (p) posMap.set(el, { x: p.x, y: p.y });
        });
        const anchorPos = posMap.get(anchorElement) || this.getElementGridPosition(anchorElement);
        if (!anchorPos) {
            console.warn('앵커 원본 위치를 찾지 못했습니다. 첫 요소를 앵커로 대체.');
        }
        const plans = draggedElements.map(el => {
            const p = posMap.get(el) || this.getElementGridPosition(el) || { x: 0, y: 0 };
            const aX = anchorPos?.x ?? p.x;
            const aY = anchorPos?.y ?? p.y;
            const { x, y } = this.위치변환(p.x, p.y, aX, aY, dropX, dropY);
            return { element: el, targetX: x, targetY: y };
        });

        
        // 경계 밖은 클램프하지 않고 이후 배치 시 실패 처리(원위치 복귀)
        return plans;
    }
}
