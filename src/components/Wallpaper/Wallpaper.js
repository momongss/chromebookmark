import Storage from "../../utils/storage.js";

export default class Wallpaper {
  constructor() {
    this._constructor();
  }

  async _constructor() {
    const $background = document.createElement("img");
    $background.className = "background-img";
    const backgroundImgSrc = await Storage.getBackgroundImage();

    $background.src = backgroundImgSrc
      ? backgroundImgSrc
      : `chrome-extension://${chrome.runtime.id}/assets/wallpaper/sky6.png`;

    const $menuBtn = document.createElement("div");
    $menuBtn.className = "menu-btn";
    $menuBtn.innerHTML = "WALLPAPER";

    const $menu = document.createElement("div");
    $menu.className = "menu-wrapper";
    $menu.innerHTML = `
      <div class="menu">
          <div class="default-img"> 
            <div class="img-wrapper">
              <img src="chrome-extension://${chrome.runtime.id}/assets/wallpaper/sky6.png">
            </div>
        </div>
        <div class="input-wrapper">
          <input type="file" accept="image/*">
        </div>
      </div>
    `;

    $menu.addEventListener("click", (e) => {
      if (e.target === $menu) {
        $menu.classList.remove("show");
      } else if (e.target.tagName === "IMG") {
        $background.src = e.target.src;
        $menu.classList.remove("show");
        Storage.setBackgroundImage(e.target.src);
      }
    });

    const $input = $menu.querySelector("input");

    $input.addEventListener("change", (e) => {
      const file = $input.files[0];
      const reader = new FileReader();
      $menu.classList.remove("show");

      reader.onloadend = function () {
        Storage.setBackgroundImage(reader.result);
        $background.src = reader.result;
      };

      if (file) {
        reader.readAsDataURL(file);
      } else {
        $background.src = "";
      }
    });

    $menuBtn.addEventListener("click", async (e) => {
      $menu.classList.toggle("show");
    });

    document.body.prepend($background);
    document.body.appendChild($menuBtn);
    document.body.appendChild($menu);

    this.eventListeners();
    this.render();
  }

  render() {}

  eventListeners() {}
}
