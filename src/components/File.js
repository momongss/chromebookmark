export default class File {
  constructor({ $app, bookMark, pos }) {
    this.$app = $app;
    this.$file = document.createElement("a");
    this.$file.className = "node file";
    this.$file.draggable = true;

    this.pos = pos;

    this.render(bookMark);
  }

  render(bookMark) {
    this.$file.href = bookMark.url;
    this.$file.dataset.id = bookMark.id;

    // const faviconURL = `chrome://favicon/${bookMark.url}`;
    let faviconURL = `chrome://favicon/size/256@1x/${bookMark.url}`;
    if (bookMark.url.includes("youtube.com")) {
      faviconURL = "../../assets/youtube.svg";
    }
    this.$file.innerHTML = `
      <div class="file-wrapper">
        <img src="${faviconURL}" draggable=true/>
        <div class="text" draggable=true>${bookMark.title}</div>
        <div class="drag-area"></div>
      </div>
    `;

    const $div = this.$app.querySelector(
      `.node-wrapper-${this.pos.x}-${this.pos.y}`
    );
    $div.innerHTML = "";
    $div.appendChild(this.$file);
  }
}
