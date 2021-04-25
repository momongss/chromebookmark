import EasyDraw from "./EasyDraw.js";
import { getRangedRandom } from "../utils/utils.js";

export default class Canvas {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    document.body.appendChild(this.canvas);

    window.addEventListener("resize", this.resize.bind(this), false);
    this.resize();

    this.drawer = new EasyDraw({ ctx: this.ctx });
    this.drawBackground();
    this.drawSky();
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(
      0,
      0,
      0,
      this.canvas.height - 700
    );

    // Add three color stops
    gradient.addColorStop(0, "rgba(48, 48, 111, 1)");
    // gradient.addColorStop(0.5, "rgba(200, 200, 200, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255)");
    gradient.addColorStop(1, "rgba(247, 117, 117, 1)");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawSky() {
    for (var j = 1; j < 2000; j++) {
      this.ctx.fillStyle = "rgb(255, 200, 150)";

      const x = Math.floor(Math.random() * this.canvas.width);
      const y = Math.floor(Math.random() * this.canvas.height);
      const r = Math.floor(getRangedRandom(1, 3.5));
      const angle = Math.random() * 180;
      const sharpness = getRangedRandom(20, 50);
      this.drawer.moveTo(x, y);
      this.drawer.rotate(angle);

      this.drawStar(r, sharpness);
    }

    this.ctx.fill();
  }

  drawStar(r, sharpness) {
    const smallAngle = 180 - sharpness;
    const bigAngle = 288 - sharpness - 180;

    for (let i = 0; i < 5; i++) {
      this.drawer.lineForward(r);
      this.drawer.rotate(smallAngle);
      this.drawer.lineForward(r);
      this.drawer.rotate(-bigAngle);
    }
  }

  resize() {
    this.stageWidth = document.body.clientWidth;
    this.stageHeight = document.body.clientHeight;

    this.canvas.width = this.stageWidth * 2;
    this.canvas.height = this.stageHeight * 2;

    this.ctx.scale(2, 2);
  }
}
