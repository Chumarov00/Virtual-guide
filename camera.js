/* =========================================================
  camera.js
  Задача:
  1) Запуск MindAR по кнопке (важно для разрешения камеры)
  2) Создание targetIndex 0..24 из targets.mind
  3) Привязка диапазонов индексов к видео
  4) При потере метки видео НЕ останавливаем
========================================================= */

/* =========================
  (A) НАСТРОЙКИ
  Тут ты меняешь пути и видео.
========================= */

// 1) Где лежит targets.mind:
// - если targets.mind рядом с camera.html -> "./targets.mind"
// - если лежит в подпапке targets/targets.mind -> "./targets/targets.mind"
const TARGETS_PATH = "./targets.mind";

// 2) Видео (лучше локально ./videos/...)
// Если видео лежат в папке videos/ рядом:
const VIDEO_URLS = {
  bulygin: "./videos/bulygin.mp4",
  naumov:  "./videos/naumov.mp4",
  pchelin: "./videos/pchelin.mp4",
};

// 3) Диапазоны индексов -> какая группа видео
function groupByIndex(i){
  if (i >= 0 && i <= 7)  return "bulygin";
  if (i >= 8 && i <= 14) return "naumov";
  if (i >= 15 && i <= 24) return "pchelin";
  return null;
}

/* =========================
  (B) DOM элементы
========================= */
const statusEl = document.getElementById("status");
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const reloadBtn = document.getElementById("reloadBtn");

const videoDock  = document.getElementById("videoDock");
const videoTitle = document.getElementById("videoTitle");
const videoHint  = document.getElementById("videoHint");
const videoEl    = document.getElementById("arVideo");

const sceneEl = document.getElementById("scene");
const targetsRoot = document.getElementById("targetsRoot");

function setStatus(text){
  statusEl.textContent = text;
}

/* =========================
  (C) Проверка targets.mind
  Чтобы не было “чёрного экрана” из-за неверного пути.
========================= */
async function checkTargetsFile(){
  // обновляем атрибут mindar-image, чтобы он точно использовал TARGETS_PATH
  sceneEl.setAttribute(
    "mindar-image",
    `imageTargetSrc: ${TARGETS_PATH}; autoStart: false; uiScanning: false; uiError: false;`
  );

  try{
    const r = await fetch(TARGETS_PATH, { cache: "no-store" });
    if(!r.ok){
      throw new Error(`targets.mind HTTP ${r.status}`);
    }
    return true;
  }catch(e){
    console.error(e);
    setStatus("targets.mind не загрузился — проверь путь/публикацию");
    alert("targets.mind не загрузился. Проверь, что файл доступен по HTTPS и путь правильный.");
    return false;
  }
}

/* =========================
  (D) Создание целей targetIndex: 0..24
  Мы не вставляем видео в 3D сцену — видео у нас HTML-оверлей.
========================= */
function buildTargets(){
  targetsRoot.innerHTML = "";

  for(let i = 0; i <= 24; i++){
    const holder = document.createElement("a-entity");
    holder.setAttribute("mindar-image-target", `targetIndex: ${i}`);

    holder.addEventListener("targetFound", () => onFound(i));
    holder.addEventListener("targetLost",  () => onLost(i));

    targetsRoot.appendChild(holder);
  }
}

/* =========================
  (E) Видео логика
========================= */
let currentGroup = null;
let currentIndex = null;

async function onFound(idx){
  const group = groupByIndex(idx);
  if(!group){
    setStatus(`Найдена метка #${idx}, но нет правила видео`);
    return;
  }

  const src = VIDEO_URLS[group];
  currentGroup = group;
  currentIndex = idx;

  // показываем панель видео
  videoDock.hidden = false;
  videoTitle.textContent = `Видео: ${group} (метка #${idx})`;
  videoHint.textContent  = "Метка найдена";

  // если уже играет это видео — не перезапускаем
  if (videoEl.getAttribute("src") === src && !videoEl.paused){
    setStatus(`Метка #${idx} — продолжаю видео`);
    return;
  }

  // ставим видео
  videoEl.src = src;

  try{
    await videoEl.play();
    setStatus(`Метка #${idx} — видео играет`);
  }catch(e){
    // autoplay может блокироваться — controls уже включены
    console.error(e);
    setStatus(`Метка #${idx} — нажми Play (автозапуск заблокирован)`);
    videoHint.textContent = "Нажми Play";
  }
}

function onLost(idx){
  // по твоему требованию — видео НЕ останавливаем
  if (idx === currentIndex){
    setStatus(`Метка #${idx} потеряна — видео продолжается`);
    videoHint.textContent = "Метка потеряна — видео продолжается";
  }
}

/* =========================
  (F) Запуск/стоп MindAR
========================= */
let running = false;

async function startAR(){
  if (running) return;

  const ok = await checkTargetsFile();
  if(!ok) return;

  buildTargets();

  const mindar = sceneEl.systems["mindar-image-system"];
  if(!mindar){
    setStatus("MindAR system не найден");
    alert("MindAR system не найден. Проверь подключение mindar-image-aframe.prod.js");
    return;
  }

  try{
    setStatus("Запуск камеры…");
    await mindar.start();
    running = true;

    setStatus("Камера запущена — наведи на метку");
    startOverlay.style.display = "none";
  }catch(e){
    console.error(e);
    setStatus(`Не удалось запустить камеру: ${e?.name || "ошибка"}`);
    alert("Не удалось запустить камеру. Проверь разрешение и что камера не занята.");
  }
}

/* =========================
  (G) События UI
========================= */
reloadBtn.addEventListener("click", () => location.reload());
startBtn.addEventListener("click", startAR);

// стартовое состояние
setStatus("Нажмите «Запустить AR»");
