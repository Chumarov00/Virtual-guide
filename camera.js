/* =========================================================
  camera.js
  - Запуск MindAR по кнопке
  - targets.mind рядом с camera.html
  - Метки: targetIndex 0..24
  - Видео: по диапазонам индексов
  - При потере метки видео НЕ останавливаем
========================================================= */

/* =========================================================
  (A) НАСТРОЙКИ: путь к targets.mind
  Если targets.mind лежит рядом с camera.html => "./targets.mind"
========================================================= */
const TARGETS_PATH = "./targets.mind";

/* =========================================================
  (B) НАСТРОЙКИ: видео
  1) Надёжный вариант: локальные файлы в папке ./videos/
     - ./videos/bulygin.mp4
     - ./videos/naumov.mp4
     - ./videos/pchelin.mp4

  2) Если используешь URL — ставь прямой mp4, не github.com/blob.
========================================================= */
const VIDEO_URLS = {
  bulygin: "./videos/bulygin.mp4",
  naumov:  "./videos/naumov.mp4",
  pchelin: "./videos/pchelin.mp4",
};

/* =========================================================
  (C) Правило: индекс метки -> группа видео
========================================================= */
function groupByIndex(i){
  if (i >= 0 && i <= 7)  return "bulygin";
  if (i >= 8 && i <= 14) return "naumov";
  if (i >= 15 && i <= 24) return "pchelin";
  return null;
}

/* =========================================================
  (D) DOM
========================================================= */
const statusEl      = document.getElementById("status");
const startOverlay  = document.getElementById("startOverlay");
const startBtn      = document.getElementById("startBtn");
const reloadBtn     = document.getElementById("reloadBtn");

const videoDock     = document.getElementById("videoDock");
const videoTitle    = document.getElementById("videoTitle");
const videoHint     = document.getElementById("videoHint");
const videoEl       = document.getElementById("arVideo");

const sceneEl       = document.getElementById("scene");
const targetsRoot   = document.getElementById("targetsRoot");

function setStatus(text){
  statusEl.textContent = text;
}

/* =========================================================
  (E) Проверка доступности targets.mind
  Если не грузится — AR не запустится.
========================================================= */
async function checkTargetsFile(){
  // Дублируем путь в атрибут mindar-image, чтобы точно совпадало
  sceneEl.setAttribute(
    "mindar-image",
    `imageTargetSrc: ${TARGETS_PATH}; autoStart:false; uiScanning:false; uiError:false;`
  );

  try{
    const r = await fetch(TARGETS_PATH, { cache: "no-store" });
    if(!r.ok) throw new Error(`targets.mind HTTP ${r.status}`);
    return true;
  }catch(e){
    console.error(e);
    setStatus("targets.mind не загрузился — проверь путь и публикацию");
    alert("targets.mind не загрузился. Проверь, что файл лежит рядом с camera.html и доступен по HTTPS.");
    return false;
  }
}

/* =========================================================
  (F) Создаём сущности меток 0..24
========================================================= */
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

/* =========================================================
  (G) Видео логика
========================================================= */
let currentIndex = null;

async function onFound(idx){
  const group = groupByIndex(idx);
  if(!group){
    setStatus(`Найдена метка #${idx}, но нет правила видео`);
    return;
  }

  const src = VIDEO_URLS[group];
  currentIndex = idx;

  // Показываем окно видео
  videoDock.hidden = false;
  videoTitle.textContent = `Видео: ${group} (метка #${idx})`;
  videoHint.textContent = "Метка найдена";

  // Если уже играет тот же файл — не перезапускаем
  if (videoEl.src && videoEl.src.endsWith(src) && !videoEl.paused){
    setStatus(`Метка #${idx} — продолжаю видео`);
    return;
  }

  // Назначаем видео
  videoEl.src = src;

  try{
    await videoEl.play();
    setStatus(`Метка #${idx} — видео играет`);
  }catch(e){
    console.error(e);
    setStatus(`Метка #${idx} — нажми Play (автозапуск заблокирован)`);
    videoHint.textContent = "Нажми Play";
  }
}

function onLost(idx){
  // Видео НЕ останавливаем
  if (idx === currentIndex){
    setStatus(`Метка #${idx} потеряна — видео продолжается`);
    videoHint.textContent = "Метка потеряна — видео продолжается";
  }
}

/* =========================================================
  (H) Запуск MindAR по кнопке
========================================================= */
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

/* =========================================================
  (I) События UI
========================================================= */
reloadBtn.addEventListener("click", () => location.reload());
startBtn.addEventListener("click", startAR);

// Начальный текст
setStatus("Нажмите «Запустить AR»");
