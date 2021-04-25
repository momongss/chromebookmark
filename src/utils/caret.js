function selectAll($el) {
  const range = document.createRange();
  range.selectNodeContents($el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

export { selectAll };
