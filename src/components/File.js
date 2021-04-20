export default class File {
  constructor({ $app }) {
    this.$app = $app;
    this.$file = document.createElement("a");
    this.$file.className = "node file";
    this.$file.draggable = true;
  }

  render(bookMark, x, y) {
    this.$file.href = bookMark.url;
    this.$file.dataset.id = bookMark.id;

    // const faviconURL = `chrome://favicon/${bookMark.url}`;
    let faviconURL = `chrome://favicon/size/256@1x/${bookMark.url}`;
    if (bookMark.url.includes("youtube.com")) {
      faviconURL = "../../assets/youtube_logo.svg";
    }
    this.$file.innerHTML = `
          <img src="${faviconURL}" draggable=true/>
          <div draggable=true>${bookMark.title}</div>
        `;

    const $div = this.$app.querySelector(`.node-wrapper-${x}-${y}`);
    $div.innerHTML = "";
    $div.appendChild(this.$file);
  }
}
