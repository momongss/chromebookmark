export default class Node {
  constructor() {
    //
  }

  dragHandler() {
    let $editTarget;

    this.$node.addEventListener("click", async (e) => {
      if (e.target.classList.contains("delete")) {
        const nodeId = $editTarget.dataset.id;
        if ($editTarget.classList.contains("file")) {
          chrome.bookmarks.remove(nodeId);
        } else {
          let subTree = await Bookmark.getSubTree(nodeId);
          subTree = subTree[0];
          if (subTree.children.length === 0) {
            chrome.bookmarks.remove(nodeId);
          } else {
            const answer = confirm(
              `정말 이 폴더를 지우시겠습니까? : ${subTree.title}`
            );
            if (!answer) {
              this.$nodeOptions.style.display = "none";
              return;
            }
            const removingTree = chrome.bookmarks.removeTree(nodeId);
          }
        }
        $editTarget.remove();
      } else if (e.target.classList.contains("edit")) {
        const $title = $editTarget.querySelector(".text");
        selectAll($title);
        $title.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            $title.blur();
          }
        });

        $title.addEventListener("blur", (e) => {
          chrome.bookmarks.update($editTarget.dataset.id, {
            title: $title.innerHTML,
          });
        });
      } else if (e.target.classList.contains("create-folder")) {
        console.log("create");
      }

      this.$nodeOptions.remove();
      this.$createOptions.remove();
    });

    console.log(this.$node.className);
    this.$node.addEventListener("contextmenu", (e) => {
      console.log("in");
      e.preventDefault();
      const $target = e.target.parentElement;

      //   this.$nodeOptions.remove();
      //   this.$createOptions.remove();
      if ($target.classList.contains("node")) {
        const $nodeOptions = document.createElement("div");
        $nodeOptions.className = "options";
        $nodeOptions.innerHTML = `
          <div class="button edit">수정</div>
          <div class="button delete">삭제</div>      
        `;
        $target.appendChild($nodeOptions);
        this.$nodeOptions = $nodeOptions;
        this.$nodeOptions.style.top = `${e.clientY}px`;
        this.$nodeOptions.style.left = `${e.clientX}px`;
        this.$nodeOptions.style.display = "block";
        $editTarget = $target;
      } else if ($target.parentElement.classList.contains("node")) {
        const $nodeOptions = document.createElement("div");
        $nodeOptions.className = "options";
        $nodeOptions.innerHTML = `
          <div class="button edit">수정</div>
          <div class="button delete">삭제</div>      
        `;
        this.$nodeOptions = $nodeOptions;
        $target.appendChild($nodeOptions);
        this.$nodeOptions.style.top = `${e.clientY}px`;
        this.$nodeOptions.style.left = `${e.clientX}px`;
        this.$nodeOptions.style.display = "block";
        $editTarget = $target.parentElement;
      } else {
        this.$createOptions.style.top = `${e.clientY}px`;
        this.$createOptions.style.left = `${e.clientX}px`;
        this.$createOptions.style.display = "block";
      }
    });
  }
}
