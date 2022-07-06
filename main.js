import App from "./src/components/App.js";

export let app;

window.onload = () => {
  const $app = document.createElement("div");
  $app.className = "app";
  document.body.appendChild($app);
  app = new App({ $app: $app });
};
