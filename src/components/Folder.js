export default class File {
  constructor({ $app, folderMangerList, folderManageTurn }) {
    this.$app = $app;
    this.$folder = document.createElement("div");
    this.$folder.className = "node folder";

    this.folderMangerList = folderMangerList;
    this.folderManageTurn = folderManageTurn;
  }

  render(bookMark, x, y) {
    this.$folder = document.createElement("div");
    this.$folder.className = "node folder";
    this.$folder.dataset.id = bookMark.id;
    this.$folder.draggable = true;
    this.$folder.innerHTML = `
          <img id="logo-8f8894ba7a1f5c7a94a170b7dc841190" src="chrome-extension://${chrome.runtime.id}/assets/folder.svg" draggable=true alt="문서"></img>
          <div draggable=true>${bookMark.title}</div>
        `;

    this.$folder.addEventListener("click", (e) => {
      for (let i = 0; i < this.folderMangerList.length; i++) {
        const folderManager = this.folderMangerList[i];
        if (folderManager.title == null) {
          this.folderManageTurn = i;
          break;
        }
      }

      const folderManager = this.folderMangerList[this.folderManageTurn];
      folderManager.render({
        bookMarkList: bookMark.children,
        title: bookMark.title,
        id: bookMark.id,
      });
      this.folderManageTurn =
        this.folderManageTurn < 2 ? this.folderManageTurn + 1 : 0;
    });

    const $div = this.$app.querySelector(`.node-wrapper-${x}-${y}`);
    $div.innerHTML = "";
    $div.appendChild(this.$folder);
  }
}
