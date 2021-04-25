function getRangedRandom(min, max) {
  return Math.random() * (max - min) + min;
}

export { getRangedRandom };
