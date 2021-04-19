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

    const faviconURL = `chrome://favicon/${bookMark.url}`;
    this.$file.innerHTML = `
          <img src="${faviconURL} draggable=true"/>
          <div draggable=true>${bookMark.title}</div>
        `;

    const $div = this.$app.querySelector(`.node-wrapper-${x}-${y}`);
    $div.innerHTML = "";
    $div.appendChild(this.$file);
  }
}
