export default class File {
  constructor({ bookMark }) {
    this.$file = document.createElement("a");
    this.$file.className = "node file";
    this.$file.draggable = true;

    this.render(bookMark);
  }

  render(bookMark) {
    this.$file.href = bookMark.url;
    this.$file.dataset.id = bookMark.id;

    let faviconURL = `chrome://favicon/size/256@1x/${bookMark.url}`;
    if (bookMark.url.includes("youtube.com")) {
      faviconURL = "../../assets/youtube.svg";
    }
    this.$file.innerHTML = `
      <div class="file-wrapper">
        <img src="${faviconURL}" draggable=true/>
        <div class="text" draggable=true contenteditable=true>${bookMark.title}</div>
        <div class="drag-area"></div>
      </div>
    `;
  }
}
