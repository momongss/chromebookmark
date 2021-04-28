import Canvas from "./src/components/Sky.js";
import App from "./src/components/App.js";

window.onload = () => {
  const $app = document.createElement("div");
  $app.className = "app";
  document.body.appendChild($app);
  new App({ $app: $app });
};
