const cases = [
  {
    title: "Поддельная купюра",
    legend:
      "Эту купюру подал купец из Торжка. Проверьте: номинал вызывает сомнения. Настоящая или поддельная?",
    authentic: false,
    frontImage: "",
    backImage: "",
    noteClass: "note-white altered",
    nominal: '<span class="first-digit">7</span>5',
    nominalText: "рублей",
    heading: "Ассигнация двадцать пять рублей",
    watermark: "водяного знака нет",
    watermarkClass: "missing-mark",
    crestClass: "flat",
    hasThreads: false,
    extra: "",
    magnifier: "След пера поверх печати",
    explanation:
      "Это фальшивка: двойку грубо переделали в семерку, а цифры не совпадают по толщине и цвету с типографской печатью. Бумага белая, без водяного знака.",
  },
  {
    title: "Подлинная ассигнация",
    legend:
      "Эту купюру предъявил в уплату подати государственный крестьянин. Оцените ее подлинность.",
    authentic: true,
    frontImage: "",
    backImage: "",
    noteClass: "note-red",
    nominal: "10",
    nominalText: "рублей",
    heading: "Государственная ассигнация",
    watermark: "Государственная казна",
    watermarkClass: "",
    crestClass: "embossed",
    hasThreads: true,
    extra: "",
    magnifier: "Мелкий знак казны",
    explanation:
      "Купюра подлинная: у десяти рублей после реформы 1786 года розовая бумага, четкий номинал, водяной знак, рельефный герб и шелковые нити в бумаге.",
  },
  {
    title: "Поддельная купюра",
    legend:
      "Эту ассигнацию пытались сбыть на ярмарке в Торжке. Взгляните внимательно - что здесь не так?",
    authentic: false,
    frontImage: "",
    backImage: "",
    noteClass: "note-yellow wrong-ink",
    nominal: "10",
    nominalText: "рублей",
    heading: "Государственная ассигнация",
    watermark: "нарисовано краской",
    watermarkClass: "fake-mark",
    crestClass: "flat",
    hasThreads: false,
    extra: '<div class="tear" aria-hidden="true"></div>',
    magnifier: "Плоская краска вместо водяного знака",
    explanation:
      "Это подделка: десять рублей должны быть на розовой бумаге, а здесь грязно-желтый тон. Водяной знак имитирован краской, тиснение герба отсутствует.",
  },
  {
    title: "Подлинная ассигнация",
    legend:
      "С этой купюрой пришел на почтовую станцию проезжий офицер. Определите, настоящая ли она.",
    authentic: true,
    frontImage: "",
    backImage: "",
    noteClass: "note-blue",
    nominal: "5",
    nominalText: "рублей",
    heading: "Государственная ассигнация",
    watermark: "Любовь к Отечеству",
    watermarkClass: "",
    crestClass: "embossed",
    hasThreads: true,
    extra: "",
    magnifier: "Тиснение заметно на свету",
    explanation:
      "Купюра подлинная: пять рублей выполнены на синей бумаге, имеют водяной знак «Любовь к Отечеству», рельефный герб и шелковые нити.",
  },
];

let currentIndex = 0;
let correctAnswers = 0;
let locked = false;
let rotationY = 0;
let dragStartX = 0;
let dragStartRotation = 0;
let draggingSpecimen = false;
let inactivityTimer = 0;

const INACTIVITY_TIMEOUT = 60 * 1000;

const app = document.querySelector(".app");
const stage = document.getElementById("banknoteStage");
const legendText = document.getElementById("legendText");
const roundLabel = document.getElementById("roundLabel");
const progressDots = document.getElementById("progressDots");
const resultPanel = document.getElementById("resultPanel");
const resultEyebrow = document.getElementById("resultEyebrow");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const nextButton = document.getElementById("nextButton");
const magnifier = document.getElementById("magnifier");
const magnifierText = document.getElementById("magnifierText");
const rotateLeftButton = document.getElementById("rotateLeftButton");
const rotateRightButton = document.getElementById("rotateRightButton");
const hintButton = document.getElementById("hintButton");
const startPanel = document.getElementById("startPanel");
const startButton = document.getElementById("startButton");

function blockBrowserEvents() {
  ["contextmenu", "selectstart", "dragstart"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => event.preventDefault());
  });

  document.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener("keydown", (event) => {
    const blockedKeys = ["F5", "F11", "F12"];
    const blockedCombo =
      (event.ctrlKey || event.metaKey) &&
      ["a", "c", "p", "r", "s", "u", "+", "-", "0"].includes(event.key.toLowerCase());

    if (blockedKeys.includes(event.key) || blockedCombo) {
      event.preventDefault();
    }
  });
}

function fitApp() {
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  app.style.transform = `scale(${scale})`;
  app.style.marginLeft = `${(window.innerWidth - 1920 * scale) / 2}px`;
  app.style.marginTop = `${(window.innerHeight - 1080 * scale) / 2}px`;
}

function requestFullscreenMode() {
  const target = document.documentElement;
  if (document.fullscreenElement || !target.requestFullscreen) return;

  target.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
}

function makeThreads() {
  return '<div class="threads" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>';
}

function renderGeneratedBanknote(item, sideLabel) {
  const threads = item.hasThreads ? makeThreads() : "";

  return `
    <article class="banknote ${item.noteClass}" aria-label="${sideLabel}">
      ${threads}
      ${item.extra}
      <header class="note-head">
        <p class="note-title">${item.heading}</p>
        <div class="denom">${item.nominal}<small>${item.nominalText}</small></div>
      </header>
      <div class="note-center">
        <div class="watermark ${item.watermarkClass}">${item.watermark}</div>
        <div class="script-lines" aria-hidden="true">
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>
        <div class="crest ${item.crestClass}" aria-label="Герб">◈</div>
      </div>
    </article>
  `;
}

function renderSpecimenSide(item, side) {
  const image = side === "front" ? item.frontImage : item.backImage;
  const sideLabel = side === "front" ? "Лицевая сторона" : "Оборотная сторона";

  if (image) {
    return `
      <article class="banknote banknote-image ${item.noteClass}" aria-label="${sideLabel}">
        <img src="${image}" alt="${sideLabel}" draggable="false" />
      </article>
    `;
  }

  if (side === "back") {
    return `
      <article class="banknote banknote-back ${item.noteClass}" aria-label="${sideLabel}">
        ${item.hasThreads ? makeThreads() : ""}
        <p class="back-title">Оборотная сторона</p>
        <div class="back-ornament">
          <span>${item.nominal.replace(/<[^>]*>/g, "")}</span>
        </div>
        <p class="back-caption">${item.watermark}</p>
      </article>
    `;
  }

  return renderGeneratedBanknote(item, sideLabel);
}

function updateSpecimenRotation() {
  const specimen = stage.querySelector(".specimen-inner");
  if (specimen) {
    specimen.style.transform = `rotateY(${rotationY}deg) rotateX(-3deg)`;
  }
}

function renderBanknote(item) {
  rotationY = 0;
  stage.innerHTML = `
    <div class="specimen" aria-label="Осмотр купюры">
      <div class="specimen-inner">
        <div class="specimen-side specimen-front">${renderSpecimenSide(item, "front")}</div>
        <div class="specimen-side specimen-back">${renderSpecimenSide(item, "back")}</div>
      </div>
    </div>
  `;
  updateSpecimenRotation();
}

function renderProgress() {
  progressDots.innerHTML = cases
    .map((_, index) => `<span class="${index < currentIndex ? "done" : ""}"></span>`)
    .join("");
}

function renderCase() {
  const item = cases[currentIndex];
  locked = false;
  legendText.textContent = item.legend;
  roundLabel.textContent = `${currentIndex + 1} / ${cases.length}`;
  magnifierText.textContent = item.magnifier;
  magnifier.classList.remove("visible");
  hintButton.classList.remove("active");
  renderBanknote(item);
  renderProgress();
}

function rotateSpecimen(delta) {
  rotationY += delta;
  updateSpecimenRotation();
}

function resetGameState() {
  currentIndex = 0;
  correctAnswers = 0;
  locked = false;
  resultPanel.hidden = true;
  magnifier.classList.remove("visible");
  hintButton.classList.remove("active");
  renderCase();
}

function returnToStartScreen() {
  resetGameState();
  startPanel.hidden = false;
}

function resetInactivityTimer() {
  window.clearTimeout(inactivityTimer);

  if (!startPanel.hidden) return;

  inactivityTimer = window.setTimeout(returnToStartScreen, INACTIVITY_TIMEOUT);
}

function answer(value) {
  if (locked) return;
  resetInactivityTimer();
  locked = true;

  const item = cases[currentIndex];
  const isCorrect = value === item.authentic;
  if (isCorrect) correctAnswers += 1;

  resultEyebrow.textContent = isCorrect ? "Верное заключение" : "Есть ошибка";
  resultTitle.textContent = item.title;
  resultText.textContent = item.explanation;
  nextButton.textContent =
    currentIndex === cases.length - 1
      ? `Итог: ${correctAnswers} из ${cases.length}. Начать снова`
      : "Следующая купюра";
  resultPanel.hidden = false;
}

function nextCase() {
  resetInactivityTimer();
  resultPanel.hidden = true;

  if (currentIndex === cases.length - 1) {
    currentIndex = 0;
    correctAnswers = 0;
  } else {
    currentIndex += 1;
  }

  renderCase();
}

document.querySelectorAll(".answer-btn").forEach((button) => {
  button.addEventListener("click", () => answer(button.dataset.answer === "true"));
});

stage.addEventListener("pointerdown", (event) => {
  requestFullscreenMode();
  draggingSpecimen = true;
  dragStartX = event.clientX;
  dragStartRotation = rotationY;
  stage.setPointerCapture(event.pointerId);
});

stage.addEventListener("pointermove", (event) => {
  if (!draggingSpecimen) return;
  const deltaX = event.clientX - dragStartX;
  rotationY = dragStartRotation + deltaX * 0.45;
  updateSpecimenRotation();
});

stage.addEventListener("pointerup", (event) => {
  draggingSpecimen = false;
  stage.releasePointerCapture(event.pointerId);
});

stage.addEventListener("pointerleave", () => {
  draggingSpecimen = false;
});

rotateLeftButton.addEventListener("click", () => {
  requestFullscreenMode();
  rotateSpecimen(-180);
});

rotateRightButton.addEventListener("click", () => {
  requestFullscreenMode();
  rotateSpecimen(180);
});

hintButton.addEventListener("click", () => {
  requestFullscreenMode();
  const isVisible = magnifier.classList.toggle("visible");
  hintButton.classList.toggle("active", isVisible);
});

startButton.addEventListener("click", () => {
  requestFullscreenMode();
  resetGameState();
  startPanel.hidden = true;
  resetInactivityTimer();
});

nextButton.addEventListener("click", nextCase);
window.addEventListener("resize", fitApp);
document.addEventListener("pointerdown", requestFullscreenMode, { once: true });
["pointerdown", "pointermove", "keydown"].forEach((eventName) => {
  document.addEventListener(eventName, resetInactivityTimer);
});

blockBrowserEvents();
fitApp();
requestFullscreenMode();
renderCase();
