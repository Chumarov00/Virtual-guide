/* =========================================================
  camera.js
  Задача:
  1) Создать якоря (targetIndex 0..24)
  2) На targetFound выбрать нужный ролик
  3) Показать видео в маленьком окне
  4) На targetLost НЕ останавливать видео
========================================================= */

/* -----------------------------
  [БЛОК A] DOM ссылки
------------------------------ */
const sceneEl     = document.getElementById("scene");
const anchorsRoot = document.getElementById("anchors");

const statusEl    = document.getElementById("status");
const panelEl     = document.getElementById("videoPanel");
const titleEl     = document.getElementById("videoTitle");
const hintEl      = document.getElementById("videoHint");
const videoEl     = document.getElementById("arVideo");

/* -----------------------------
  [БЛОК B] Настройка источников
  ВАЖНО: тут ты будешь менять пути.
  Лучший вариант:
  - положить mp4 рядом в репо (или в /videos/)
  - указать относительные пути
------------------------------ */
const VIDEO_SOURCES = {
  bulygin: "./videos/Bulygin's House.mp4",   // <-- поменяй путь под себя
  naumov:  "./videos/Naumov's house.mp4",    // <-- поменяй путь под себя
  pchelin: "./videos/Pchelin's House.MP4"   // <-- поменяй путь под себя
};

/* -----------------------------
  [БЛОК C] Правило: index -> группа видео
  По твоему ТЗ:
  0..7   -> bulygin
  8..14  -> naumov
  15..24 -> pchelin
------------------------------ */
function groupByTargetIndex(i){
  if (i >= 0 && i <= 7)   return "bulygin";
  if (i >= 8 && i <= 14)  return "naumov";
  if (i >= 15 && i <= 24) return "pchelin";
  return null;
}

/* -----------------------------
  [БЛОК D] Текущее состояние
------------------------------ */
let currentGroup = null;   // какая группа сейчас играет
let currentIndex = null;   // какой targetIndex последний нашли

/* -----------------------------
  [БЛОК E] Утилиты UI
------------------------------ */
function setStatus(text){
  statusEl.textContent = text;
}

function showPanel(){
  panelEl.hidden = false;
}

function setPanelText(group, index, found){
  // Заголовок
  titleEl.textContent = `Видео: ${group} (метка #${index})`;

  // Подсказка справа
  hintEl.textContent = found ? "Метка найдена" : "Метка потеряна (видео продолжает идти)";
}

/* -----------------------------
  [БЛОК F] Включение видео
  - Если та же группа: не перезапускаем
  - Если другая группа: меняем src и стартуем
------------------------------ */
async function playGroup(group, index){
  const src = VIDEO_SOURCES[group];

  if (!src){
    setStatus(`Нет источника для группы: ${group}`);
    return;
  }

  // Если уже играет нужная группа — ничего не делаем
  if (currentGroup === group && !videoEl.paused){
    currentIndex = index;
    setPanelText(group, index, true);
    showPanel();
    setStatus(`Метка #${index} → продолжаю это же видео`);
    return;
  }

  currentGroup = group;
  currentIndex = index;

  // Меняем источник
  videoEl.src = src;

  // Показываем панель
  setPanelText(group, index, true);
  showPanel();
  setStatus(`Метка #${index} → загружаю видео…`);

  try{
    // Пытаемся запустить
    await videoEl.play();
    setStatus(`Видео играет (метка #${index})`);
  }catch(e){
    // Автовоспроизведение может блокироваться политиками браузера [Unverified]
    setStatus("Видео готово. Нажми Play в плеере.");
  }
}

/* -----------------------------
  [БЛОК G] Создаём anchors 0..24
  Эти entity нужны для событий targetFound/targetLost
------------------------------ */
function buildAnchors(){
  for(let i = 0; i <= 24; i++){
    const a = document.createElement("a-entity");
    a.setAttribute("mindar-image-target", `targetIndex: ${i}`);

    // Сохраним индекс в dataset для удобства
    a.dataset.index = String(i);

    // Событие: метка найдена
    a.addEventListener("targetFound", async () => {
      const idx = Number(a.dataset.index);
      const group = groupByTargetIndex(idx);

      if (!group){
        setStatus(`Нашёл метку #${idx}, но нет правила для видео`);
        return;
      }

      await playGroup(group, idx);
    });

    // Событие: метка потеряна
    // ВАЖНО: НЕ прячем панель и НЕ ставим pause()
    a.addEventListener("targetLost", () => {
      const idx = Number(a.dataset.index);

      // Обновим подсказку только если это “текущая” метка
      if (idx === currentIndex && currentGroup){
        setPanelText(currentGroup, idx, false);
        setStatus(`Метка #${idx} потеряна, видео продолжает идти`);
      }
    });

    anchorsRoot.appendChild(a);
  }
}

/* -----------------------------
  [БЛОК H] Старт
------------------------------ */
sceneEl.addEventListener("loaded", () => {
  buildAnchors();
  setStatus("Камера включается… Наведи на метку");
});

/* Если MindAR упадёт, будет arError */
sceneEl.addEventListener("arError", () => {
  setStatus("Ошибка AR. Проверь HTTPS и доступ к камере.");
});
