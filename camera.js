/* =========================================================
  camera.js — автозапуск, распознавание меток, показ видео
  Диапазоны:
  0..7   -> Bulygin's House.mp4
  8..14  -> Naumov's house.mp4
  15..24 -> Pchelin's House.MP4
  ВАЖНО: при потере метки видео НЕ останавливаем
========================================================= */

const sceneEl     = document.getElementById("scene");
const anchorsRoot = document.getElementById("anchors");

const statusEl    = document.getElementById("status");
const panelEl     = document.getElementById("videoPanel");
const titleEl     = document.getElementById("videoTitle");
const hintEl      = document.getElementById("videoHint");
const videoEl     = document.getElementById("arVideo");

/* -----------------------------
  1) Ссылки на видео
  ВАЖНО: это должны быть ПРЯМЫЕ mp4 URL.
  Если не работает — открой ссылку в браузере:
  она должна отдавать mp4, а не страницу GitHub.
------------------------------ */
const VIDEO_URLS = {
  bulygin: "https://chumarov00.github.io/Virtual-guide/Bulygin%27s%20House.mp4",
  naumov:  "https://chumarov00.github.io/Virtual-guide/Naumov%27s%20house.mp4",
  pchelin: "https://chumarov00.github.io/Virtual-guide/Pchelin%27s%20House.MP4",
};

/* -----------------------------
  2) targetIndex -> группа видео
------------------------------ */
function groupByIndex(i){
  if (i >= 0 && i <= 7)   return "bulygin";
  if (i >= 8 && i <= 14)  return "naumov";
  if (i >= 15 && i <= 24) return "pchelin";
  return null;
}

/* -----------------------------
  3) Состояние
------------------------------ */
let currentGroup = null;
let currentIndex = null;

/* -----------------------------
  4) UI утилиты
------------------------------ */
function setStatus(text){ statusEl.textContent = text; }

function showVideoPanel(group, idx, found){
  panelEl.hidden = false;
  titleEl.textContent = `Видео (метка #${idx})`;
  hintEl.textContent = found
    ? `Найдена метка #${idx} — группа: ${group}`
    : `Метка потеряна — видео продолжает идти`;
}

/* -----------------------------
  5) Запуск нужного видео
  Правило:
  - если уже играет нужная группа -> не перезапускаем
  - если другая группа -> меняем src и play()
------------------------------ */
async function ensureVideo(group, idx){
  const src = VIDEO_URLS[group];

  if (!src){
    setStatus(`Нет видео для группы: ${group}`);
    return;
  }

  // если тот же ролик уже выбран — просто обновляем UI
  if (currentGroup === group && videoEl.src === src && !videoEl.paused){
    currentIndex = idx;
    showVideoPanel(group, idx, true);
    setStatus(`Метка #${idx} — продолжаю текущий ролик`);
    return;
  }

  currentGroup = group;
  currentIndex = idx;

  // меняем видео
  videoEl.src = src;
  showVideoPanel(group, idx, true);
  setStatus(`Метка #${idx} — загружаю видео…`);

  try{
    // попытка автозапуска (может блокироваться политикой браузера) [Unverified]
    await videoEl.play();
    setStatus(`Видео играет (метка #${idx})`);
  }catch(e){
    setStatus("Видео готово. Если не стартовало — нажми Play на плеере.");
  }
}

/* -----------------------------
  6) Создаём anchors 0..24
------------------------------ */
function buildAnchors(){
  for(let i = 0; i <= 24; i++){
    const a = document.createElement("a-entity");
    a.setAttribute("mindar-image-target", `targetIndex: ${i}`);
    a.dataset.index = String(i);

    a.addEventListener("targetFound", async () => {
      const idx = Number(a.dataset.index);
      const group = groupByIndex(idx);

      if (!group){
        setStatus(`Нашёл метку #${idx}, но нет правила для видео`);
        return;
      }

      await ensureVideo(group, idx);
    });

    a.addEventListener("targetLost", () => {
      const idx = Number(a.dataset.index);
      if (idx === currentIndex && currentGroup){
        showVideoPanel(currentGroup, idx, false);
        setStatus(`Метка #${idx} потеряна — видео продолжает идти`);
      }
      // ВАЖНО: никаких pause(), videoPanel не скрываем
    });

    anchorsRoot.appendChild(a);
  }
}

/* -----------------------------
  7) Старт
------------------------------ */
sceneEl.addEventListener("loaded", () => {
  buildAnchors();
  setStatus("Сканирование… Наведи на метку");
});

/* Если есть проблемы с камерой/AR */
sceneEl.addEventListener("arError", () => {
  setStatus("Ошибка AR. Проверь HTTPS и разрешение камеры.");
});
