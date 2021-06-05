function selectAll($el) {
  const range = document.createRange();
  range.selectNodeContents($el);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function clearSelection() {
  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  } else if (document.selection) {
    document.selection.empty();
  }
}

export { selectAll, clearSelection };
