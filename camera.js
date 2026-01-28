/* =========================================================
  camera.js — минимальный рабочий MindAR:
  - targets.mind берётся из ./targets.mind (рядом с файлами)
  - создаём targetIndex 0..24
  - по распознаванию показываем маленькое HTML-видео-окно
  - при потере метки видео НЕ останавливаем
  - автостарт: пытаемся стартануть сразу; если браузер блокирует — старт при первом клике по экрану
========================================================= */

const sceneEl = document.getElementById("scene");
const targetsRoot = document.getElementById("targetsRoot");

const msgEl = document.getElementById("msg");
const videoDock = document.getElementById("videoDock");
const overlayVideo = document.getElementById("overlayVideo");
const videoLabel = document.getElementById("videoLabel");

let running = false;
let lastVideoUrl = null;

/* ====== ТВОЯ ПРИВЯЗКА ИНДЕКСОВ -> ВИДЕО ======
   ВАЖНО:
   - ссылки вида github.com/.../blob/... НЕ подходят (там HTML-страница).
   - Надёжно: положить mp4 рядом/в папку и ссылаться относительным путём.
   Я оставил URL как ты дал — но если не заработает, это 99% из-за "blob".
*/
function getVideoUrlByTargetIndex(i){
  if (i >= 0 && i <= 7)  return "https://github.com/Chumarov00/Virtual-guide/blob/main/Bulygin's%20House.mp4";
  if (i >= 8 && i <= 14) return "https://github.com/Chumarov00/Virtual-guide/blob/main/Naumov's%20house.mp4";
  if (i >= 15 && i <= 24) return "https://github.com/Chumarov00/Virtual-guide/blob/main/Pchelin's%20House.MP4";
  return null;
}

/* Создаём targetIndex 0..24 */
function buildTargets(){
  const MAX = 24;
  for (let i = 0; i <= MAX; i++){
    const t = document.createElement("a-entity");
    t.setAttribute("mindar-image-target", `targetIndex: ${i}`);

    // События MindAR
    t.addEventListener("targetFound", () => onFound(i));
    t.addEventListener("targetLost",  () => onLost(i));

    targetsRoot.appendChild(t);
  }
}

/* Показать сообщение */
function setMsg(text){
  msgEl.textContent = text;
}

/* При распознавании */
async function onFound(index){
  const url = getVideoUrlByTargetIndex(index);
  setMsg(`Метка #${index} распознана`);

  if (!url){
    return;
  }

  // Если это уже то же самое видео — ничего не делаем
  if (lastVideoUrl === url && !overlayVideo.paused){
    videoDock.hidden = false;
    return;
  }

  lastVideoUrl = url;

  // Показываем окно
  videoDock.hidden = false;
  videoLabel.textContent = `Видео для метки #${index}`;

  // Меняем источник
  overlayVideo.src = url;

  try{
    await overlayVideo.play();
  }catch(e){
    // Если браузер не дал autoplay — покажем подсказку
    setMsg(`Метка #${index} распознана — нажми на видео, чтобы стартовало`);
    // Клик по видео = пользовательский жест
    overlayVideo.controls = true;
  }
}

/* При потере метки — видео НЕ останавливаем */
function onLost(index){
  setMsg(`Метка #${index} потеряна — видео продолжается`);
  // НИЧЕГО не делаем: не pause(), не скрываем окно
}

/* Запуск MindAR */
async function startMindAR(){
  if (running) return;

  const sys = sceneEl.systems["mindar-image-system"];
  if (!sys){
    setMsg("MindAR system не найден (проверь подключение mindar-image-aframe.prod.js)");
    return;
  }

  try{
    setMsg("Запуск камеры…");
    await sys.start();
    running = true;
    setMsg("Камера включена — наведи на метку");
  }catch(e){
    // Частая причина: браузер требует жест (tap/click), либо камера занята.
    setMsg("Не удалось стартовать. Кликни по экрану для запуска / проверь, что камера не занята.");
    console.error(e);
  }
}

/* Пытаемся стартовать, но если браузер блокирует — старт по первому клику */
function armAutostart(){
  // 1) попытка сразу после загрузки сцены
  startMindAR();

  // 2) запасной вариант: первый клик/тап
  const once = async () => {
    await startMindAR();
    window.removeEventListener("click", once);
    window.removeEventListener("touchstart", once);
  };
  window.addEventListener("click", once, { once: true });
  window.addEventListener("touchstart", once, { once: true });
}

/* Инициализация */
sceneEl.addEventListener("loaded", () => {
  buildTargets();
  setMsg("Готово. Запускаю камеру…");
  armAutostart();
});
