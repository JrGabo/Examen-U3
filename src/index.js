import './css/b5.css';
import './css/main.css';

// Validador de regex

const MAX_MATCHES = 500;
const ALERT_TIMEOUT = 4000;

const ALERT_ICONS = {
  success: "✔",
  error: "✖",
  info: "ℹ",
};

// Escapa html para no romper la caja de resultados
function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Saca el patron y las banderas del input (acepta /patron/flags o solo el patron)
function parseRegex(raw) {
  const trimmed = raw.trim();

  if (!trimmed) {
    throw new Error("Ingresa una expresión regular para poder comparar.");
  }

  const match = trimmed.match(/^\/([\s\S]*)\/([gimsuy]*)$/);
  const pattern = match ? match[1] : trimmed;
  const flags = match ? match[2] : "";

  try {
    new RegExp(pattern, flags);
  } catch (e) {
    throw new Error("Expresión regular inválida: " + e.message);
  }

  return { pattern, flags };
}

// Busca todas las coincidencias en el texto
function findMatches(pattern, flags, text) {
  const globalFlags = flags.includes("g") ? flags : flags + "g";
  const regex = new RegExp(pattern, globalFlags);
  const matches = [];

  let m = regex.exec(text);
  while (m !== null) {
    matches.push({ index: m.index, value: m[0] });

    if (matches.length >= MAX_MATCHES) {
      break;
    }

    // si el match mide 0 avanzamos para no quedarnos en un loop infinito
    if (m[0] === "") {
      regex.lastIndex += 1;
    }

    m = regex.exec(text);
  }

  return matches;
}

// Pinta las coincidencias con <mark> dentro del texto
function highlightMatches(text, matches) {
  let html = "";
  let cursor = 0;

  for (let i = 0; i < matches.length; i++) {
    const item = matches[i];

    if (item.index < cursor) {
      continue;
    }

    html += escapeHtml(text.slice(cursor, item.index));
    html += '<mark class="match">' + escapeHtml(item.value) + "</mark>";
    cursor = item.index + item.value.length;
  }

  return html + escapeHtml(text.slice(cursor));
}

// Cierra una alerta con animacion
function dismissAlert(toast) {
  if (!toast.isConnected) return;
  if (toast.classList.contains("alert--hide")) return;

  toast.classList.add("alert--hide");

  setTimeout(function () {
    toast.remove();
  }, 400);
}

// Muestra una alerta
function showAlert(message, type) {
  type = type || "info";

  const container = document.getElementById("alerts");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "alert alert--" + type;

  const icon = document.createElement("span");
  icon.className = "alert__icon";
  icon.textContent = ALERT_ICONS[type] || ALERT_ICONS.info;

  const body = document.createElement("p");
  body.className = "alert__message";
  body.textContent = message;

  const close = document.createElement("button");
  close.className = "alert__close";
  close.type = "button";
  close.textContent = "×";
  close.onclick = function () {
    dismissAlert(toast);
  };

  toast.appendChild(icon);
  toast.appendChild(body);
  toast.appendChild(close);
  container.appendChild(toast);

  setTimeout(function () {
    dismissAlert(toast);
  }, ALERT_TIMEOUT);
}

// Esconde la tarjeta de resultado
function hideResult() {
  document.getElementById("result").hidden = true;
  document.getElementById("result-status").textContent = "";
  document.getElementById("result-detail").textContent = "";
  document.getElementById("result-matches").innerHTML = "";
  document.getElementById("result-matches").hidden = true;
}

// Muestra el resultado en pantalla
function renderResult(isMatch, matches, pattern, flags, text, truncated) {
  const result = document.getElementById("result");
  const status = document.getElementById("result-status");
  const detail = document.getElementById("result-detail");
  const matchesBox = document.getElementById("result-matches");

  result.hidden = false;

  if (isMatch) {
    result.classList.add("result--success");
    result.classList.remove("result--error");
    status.textContent = "✔ El texto CUMPLE con la expresión regular.";
  } else {
    result.classList.add("result--error");
    result.classList.remove("result--success");
    status.textContent = "✖ El texto NO cumple con la expresión regular.";
  }

  let count = matches.length;
  if (truncated) {
    count = count + "+";
  }

  detail.textContent =
    "Patrón: /" + pattern + "/" + (flags || "—") + " · Coincidencias: " + count;

  if (matches.length > 0) {
    matchesBox.innerHTML = highlightMatches(text, matches);
    matchesBox.hidden = false;
  } else {
    matchesBox.innerHTML = "";
    matchesBox.hidden = true;
  }
}

// Cuando se le da click a Comparar
function onSubmit(event) {
  event.preventDefault();

  const regexInput = document.getElementById("regex-input");
  const textInput = document.getElementById("text-input");

  let pattern, flags;

  try {
    const parsed = parseRegex(regexInput.value);
    pattern = parsed.pattern;
    flags = parsed.flags;
  } catch (err) {
    hideResult();
    showAlert(err.message, "error");
    return;
  }

  const text = textInput.value;

  if (!text.trim()) {
    hideResult();
    showAlert("Ingresa un texto para evaluar.", "error");
    return;
  }

  const isMatch = new RegExp(pattern, flags).test(text);
  const matches = findMatches(pattern, flags, text);
  const truncated = matches.length >= MAX_MATCHES;

  renderResult(isMatch, matches, pattern, flags, text, truncated);

  if (isMatch) {
    showAlert("El texto cumple con la expresión regular.", "success");
  } else {
    showAlert("El texto no cumple con la expresión regular.", "error");
  }
}

// Cuando se le da click a Limpiar
function onClear() {
  document.getElementById("regex-form").reset();
  document.getElementById("regex-input").value = "";
  document.getElementById("text-input").value = "";
  document.getElementById("alerts").innerHTML = "";

  hideResult();
  document.getElementById("regex-input").focus();

  showAlert("Pantalla limpia. Puedes ingresar una nueva expresión.", "info");
}

// Arranca la app
function init() {
  document.getElementById("regex-form").addEventListener("submit", onSubmit);
  document.getElementById("clear-btn").addEventListener("click", onClear);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}