import App from "./src/components/App.js";

const $app = document.createElement("div");
$app.className = "app";

document.body.appendChild($app);

new App({ $app: $app });
