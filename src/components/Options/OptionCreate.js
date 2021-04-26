import FolderApp from "../Folder/FolderApp.js";
import FolderMain from "../Folder/FolderMain.js";

import { selectAll } from "../../utils/caret.js";
import { constDatas } from "../../utils/const.js";
import Storage from "../../utils/storage.js";

export default class OptionCreate {
  constructor({ $app, $target, x, y, mode, onClick }) {
    const $createOptions = document.createElement("div");
    $createOptions.className = "options create";
    $createOptions.innerHTML = `
          <div class="button create-folder">새 폴더</div>
        `;

    console.log($target);

    this.$createOptions = $createOptions;
    this.$createOptions.style.display = "block";
    this.$createOptions.style.top = `${y}px`;
    this.$createOptions.style.left = `${x}px`;

    $target.appendChild($createOptions);

    $createOptions.addEventListener("click", (e) => {
      const bookMark = { id: 0, title: "", children: [] };
      if (mode === "app") {
      }
      const newFolder =
        mode === "app"
          ? new FolderApp({
              $app: $app,
              $target,
              bookMark: bookMark,
              $target: $target,
            })
          : new FolderMain({
              $manager: $target,
              bookMark: bookMark,
              onClick: () => {
                onClick(bookMark);
              },
            });
      console.log(newFolder.$node);

      const $text = newFolder.$node.querySelector(".text");
      selectAll($text);
      $text.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          $text.blur();
        }
      });

      const tmp = $target.className.split("-");
      const pos = { x: parseInt(tmp[2]), y: parseInt(tmp[3]) };

      $text.addEventListener("blur", (e) => {
        const parentId = $target.dataset.id
          ? $target.dataset.id
          : constDatas.rootId;
        console.log($text.innerHTML, parentId);
        chrome.bookmarks.create(
          {
            title: $text.innerHTML,
            parentId: parentId,
          },
          (created) => {
            Storage.setPos(created.id, pos);

            console.log(newFolder.$node);
            newFolder.render({ id: created.id, title: $text.innerHTML });
            console.log(newFolder.$node);
          }
        );
      });
    });
  }
}
