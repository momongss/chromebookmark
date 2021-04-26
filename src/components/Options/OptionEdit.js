export default class OptionEdit {
  constructor({ $target, x, y }) {
    const $nodeOptions = document.createElement("div");
    $nodeOptions.className = "options";
    $nodeOptions.innerHTML = `
          <div class="button edit">수정</div>
          <div class="button delete">삭제</div>      
        `;
    this.$nodeOptions = $nodeOptions;
    this.$nodeOptions.style.top = `${y}px`;
    this.$nodeOptions.style.left = `${x}px`;
    this.$nodeOptions.style.display = "block";

    this.$delete = $nodeOptions.querySelector(".delete");
    this.$edit = $nodeOptions.querySelector(".edit");

    $target.appendChild($nodeOptions);

    this.eventListers();
  }

  eventListers() {
    this.$delete.addEventListener("click", (e) => {
      console.log("del");
    });
  }
}
