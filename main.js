import App from "./src/components/App.js";
import FileNode from "./src/components/File/File.js";

window.onload = () => {
  const $app = document.createElement("div");
  $app.className = "app";
  document.body.appendChild($app);
  new App({ $app: $app });
};
