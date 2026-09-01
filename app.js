// Прототип флоу: логин → список чатботов (лимит 5) → удаление через диалог → Continue
"use strict";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSegZkuyrvsgqxFXrXsUU0V4mICHIbQSNE3CruYJScyMLKdTYA/viewform?usp=publish-editor";

const LIMIT = 5;

const INITIAL_CHATBOTS = [
  { id: "brainy", group: "device", name: "BrainyMcThinkface", desc: "Sonnet 4 — sharp reasoning, fast replies" },
  { id: "captain", group: "account", name: "Captain Context", desc: "Opus 4 — deep analysis & long-form writing" },
  { id: "speedy", group: "account", name: "Speedy Gonzalez AI", desc: "Haiku 3.5 — lightning-fast lightweight helper" },
  { id: "sir", group: "account", name: "Sir Chats-a-Lot", desc: "GPT-4o — versatile all-rounder chatbot" },
  { id: "overthinker", group: "account", name: "The Overthinker", desc: "Gemini 2.5 Pro — multimodal deep thinker" },
  { id: "pixel", group: "account", name: "Pixel Whisperer", desc: "Sonnet 4 — design-savvy creative assistant" },
];

const state = {
  chatbots: INITIAL_CHATBOTS.map((c) => ({ ...c })),
  pendingDelete: null, // id чатбота, по корзинке которого открыли диалог
};

const els = {
  screens: {
    login: document.getElementById("screen-login"),
    list: document.getElementById("screen-list"),
  },
  loginBtn: document.getElementById("login-btn"),
  backBtn: document.getElementById("back-btn"),
  title: document.getElementById("list-title"),
  sub: document.getElementById("list-sub"),
  groups: document.getElementById("groups"),
  continueBtn: document.getElementById("continue-btn"),
  dialog: document.getElementById("dialog"),
  dialogDelete: document.getElementById("dialog-delete"),
  dialogCancel: document.getElementById("dialog-cancel"),
  dialogX: document.getElementById("dialog-x"),
};

/* ---------- Рендер ---------- */

function showScreen(name) {
  for (const [key, el] of Object.entries(els.screens)) {
    el.hidden = key !== name;
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[ch];
  });
}

function renderHeader() {
  const count = state.chatbots.length;
  const over = count > LIMIT;

  els.title.textContent = over
    ? `Слишком много чатботов: ${count} of ${LIMIT}`
    : `Все ок по количеству чатботов: ${count} of ${LIMIT}`;
  els.title.classList.toggle("screen-title--error", over);
  els.title.classList.toggle("screen-title--ok", !over);

  els.sub.textContent = over
    ? "Всего может быть 5 чатботов. Удали какой-нибудь чтобы продолжить"
    : "You meet your limit of 5 inboxes. Continue to AdGuard Mail";

  els.continueBtn.disabled = over;
}

// Плавная смена заголовка/подписи (перезапуск fade-анимации при изменении)
let lastHeaderKey = null;

function animateHeaderSwap() {
  const key = `${els.title.textContent}|${els.sub.textContent}`;
  if (key === lastHeaderKey) return;
  lastHeaderKey = key;
  for (const el of [els.title, els.sub]) {
    el.classList.remove("header-swap");
    void el.offsetWidth; // рестарт CSS-анимации
    el.classList.add("header-swap");
  }
}

function rowEl(bot, isFirst) {
  const row = document.createElement("div");
  row.className = "row" + (isFirst ? "" : " row--lined");
  row.innerHTML = `
    <div class="row-texts">
      <span class="row-title">${escapeHtml(bot.name)}</span>
      <span class="row-sub">${escapeHtml(bot.desc)}</span>
    </div>
    <button class="icon-btn row-trash" type="button" data-id="${bot.id}"
      aria-label="Удалить ${escapeHtml(bot.name)}">
      <img src="assets/trash.svg" alt="" width="24" height="24" />
    </button>`;
  return row;
}

function groupEl(label, bots, note) {
  if (!bots.length) return null;
  const frag = document.createDocumentFragment();
  const labelEl = document.createElement("p");
  labelEl.className = "section-label";
  labelEl.textContent = label;
  frag.append(labelEl);
  bots.forEach((bot, i) => frag.append(rowEl(bot, i === 0)));
  if (note) {
    const noteEl = document.createElement("p");
    noteEl.className = "attach-note";
    noteEl.textContent = note;
    frag.append(noteEl);
  }
  return frag;
}

function renderList() {
  const device = state.chatbots.filter((c) => c.group === "device");
  const account = state.chatbots.filter((c) => c.group === "account");
  // Подпись про прикрепление к аккаунту — только когда лимит соблюдён
  const note = state.chatbots.length <= LIMIT
    ? "Этот чатбот прикрепится к твоему аккаунту после входа"
    : null;

  const nodes = [
    groupEl("Чатбот созданный на этом устройстве", device, note),
    groupEl("Чатботы прикрепленные к аккаунту", account),
  ].filter(Boolean);

  els.groups.replaceChildren(...nodes);
}

function render() {
  renderHeader();
  animateHeaderSwap();
  renderList();
}

/* ---------- Диалог ---------- */

function openDialog(id) {
  state.pendingDelete = id;
  els.dialog.hidden = false;
}

function closeDialog() {
  state.pendingDelete = null;
  els.dialog.hidden = true;
}

/* ---------- События ---------- */

els.loginBtn.addEventListener("click", () => {
  // Демо-сценарий всегда начинается с оверлимита: сбрасываем список к 6 чатботам
  state.chatbots = INITIAL_CHATBOTS.map((c) => ({ ...c }));
  render();
  showScreen("list");
});

els.backBtn.addEventListener("click", () => {
  showScreen("login");
});

els.groups.addEventListener("click", (e) => {
  const btn = e.target.closest(".row-trash");
  if (btn) openDialog(btn.dataset.id);
});

els.dialogDelete.addEventListener("click", () => {
  if (state.pendingDelete === null) return;
  const id = state.pendingDelete;
  state.chatbots = state.chatbots.filter((c) => c.id !== id);
  closeDialog();
  animateRowRemoval(id, render);
});

// Строка схлопывается, остальные элементы (FLIP) плавно съезжают на её место,
// после чего обновляем заголовок и пересобираем список
function animateRowRemoval(id, done) {
  const trashBtn = els.groups.querySelector(`.row-trash[data-id="${CSS.escape(id)}"]`);
  const row = trashBtn && trashBtn.closest(".row");
  if (!row) {
    done();
    return;
  }

  const children = Array.from(els.groups.children);
  const index = children.indexOf(row);
  const shift = row.getBoundingClientRect().height;

  // 1. Замораживаем то, что ниже удаляемого: сдвигаем вниз на высоту строки
  children.forEach((el, i) => {
    if (i <= index) return;
    el.style.transition = "none";
    el.style.transform = `translateY(${shift}px)`;
  });

  // 2. Начинаем схлопывание строки
  row.classList.add("row--removing");
  void els.groups.offsetHeight; // фиксируем layout до следующего кадра

  // 3. Отпускаем: строки плавно съезжают вверх синхронно со схлопыванием
  requestAnimationFrame(() => {
    children.forEach((el, i) => {
      if (i <= index) return;
      el.style.transition = "";
      el.style.transform = "";
    });
  });

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    done();
  };
  row.addEventListener("transitionend", (e) => {
    if (e.target === row && e.propertyName === "max-height") finish();
  });
  setTimeout(finish, 400); // страховка, если transitionend не сработает
}

els.dialogCancel.addEventListener("click", closeDialog);
els.dialogX.addEventListener("click", closeDialog);

// Клик по затемнению вокруг диалога тоже закрывает
els.dialog.addEventListener("click", (e) => {
  if (e.target === els.dialog) closeDialog();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.dialog.hidden) closeDialog();
});

els.continueBtn.addEventListener("click", () => {
  if (!els.continueBtn.disabled) {
    window.location.href = FORM_URL;
  }
});

/* ---------- Масштаб «телефона» под вьюпорт ---------- */

function fitPhone() {
  const scale = Math.min(1, window.innerWidth / 380, window.innerHeight / 820);
  document.querySelector(".phone").style.setProperty("--s", scale.toFixed(4));
}

window.addEventListener("resize", fitPhone);

/* ---------- Старт ---------- */

fitPhone();
render();
showScreen("login");
