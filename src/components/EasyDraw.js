export default class EasyDraw {
  constructor({ ctx, initPos, initAngle }) {
    this.ctx = ctx;
    this.angle = initAngle ? initAngle : 0;

    this.x = 0;
    this.y = 0;
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;

    this.ctx.moveTo(this.x, this.y);
  }

  moveForward(dist) {
    this.moveTo(
      Math.cos(Math.PI * this.angle) * dist,
      Math.sign(Math.PI * this.angle) * dist
    );
  }

  drawLine(dist) {
    this.x += Math.cos((Math.PI * this.angle) / 180) * dist;
    this.y += Math.sin((Math.PI * this.angle) / 180) * dist;

    this.ctx.lineTo(this.x, this.y);
    this.ctx.stroke();
  }

  lineForward(dist) {
    this.x += Math.cos((Math.PI * this.angle) / 180) * dist;
    this.y += Math.sin((Math.PI * this.angle) / 180) * dist;

    this.ctx.lineTo(this.x, this.y);
  }

  rotate(angle) {
    this.angle += angle;
  }

  lookCurPos(len) {
    this.prevColor = this.ctx.fillStyle;
    this.ctx.fillStyle = "rgb(255, 0, 0)";
    this.drawRect(this.x, this.y, len ? len : 5);
    this.ctx.fillStyle = this.prevColor;
  }

  drawRect(x, y, r) {
    this.ctx.fillRect(x, y, r, r);
  }
}
