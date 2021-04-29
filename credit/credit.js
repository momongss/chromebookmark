// document.querySelector(".credit-btn").addEventListener("click", (e) => {
//   document.querySelector(".credits").classList.toggle("show");
// });

document.querySelectorAll("a").forEach(($a) => {
  $a.addEventListener("click", (e) => {
    window.open($a.href);
  });
});
