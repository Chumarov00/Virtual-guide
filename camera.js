/* =========================================================
  camera.js
  - Старт AR (камера) сразу, если можно
  - Если браузер требует “жест” — просим клик/тап
  - Ловим targetFound/targetLost для 0..24
  - Привязка видео к диапазонам:
    0..7   -> Bulygin
    8..14  -> Naumov
    15..24 -> Pchelin
  - При потере метки видео НЕ останавливаем
========================================================= */

const sceneEl     = document.getElementById("scene");
const anchorsRoot = document.getElementById("anchors");

const statusEl    = document.getElementById("status");
const tapEl       = document.getElementById("tap");

const videoPanel  = document.getElementById("videoPanel");
const videoTitle  = document.getElementById("videoTitle");
const videoHint   = document.getElementById("videoHint");
const videoEl     = document.getElementById("arVideo");

/* ====== ВИДЕО-ССЫЛКИ ======
   ВАЖНО: это должны быть ПРЯМЫЕ mp4, а не github.com/blob.
   Если не проигрывается — открой ссылку в браузере: должна открыться/скачаться mp4.
*/
const VIDEO_URLS = {
  bulygin: "https://chumarov00.github.io/Virtual-guide/Bulygin%27s%20House.mp4",
  naumov:  "https://chumarov00.github.io/Virtual-guide/Naumov%27s%20house.mp4",
  pchelin: "https://chumarov00.github.io/Virtual-guide/Pchelin%27s%20House.MP4",
};

function setStatus(t){ statusEl.textContent = t; }

/* targetIndex -> группа */
function groupByIndex(i){
  if (i >= 0 && i <= 7)   return "bulygin";
  if (i >= 8 && i <= 14)  return "naumov";
  if (i >= 15 && i <= 24) return "pchelin";
  return null;
}

/* Состояние */
let running = false;
let currentGroup = null;
let currentIndex = null;

/* Создаём anchors 0..24 */
function buildAnchors(){
  for(let i = 0; i <= 24; i++){
    const a = document.createElement("a-entity");
    a.setAttribute("mindar-image-target", `targetIndex: ${i}`);

    a.addEventListener("targetFound", () => onFound(i));
    a.addEventListener("targetLost",  () => onLost(i));

    anchorsRoot.appendChild(a);
  }
}

/* Когда метка найдена */
async function onFound(idx){
  const group = groupByIndex(idx);
  if(!group){
    setStatus(`Найдена метка #${idx}, но нет правила для видео`);
    return;
  }

  const src = VIDEO_URLS[group];
  currentGroup = group;
  currentIndex = idx;

  videoPanel.hidden = false;
  videoTitle.textContent = `Видео: ${group} (метка #${idx})`;
  videoHint.textContent  = "Метка найдена";

  // Если уже играет этот же ролик — не перезапускаем
  if (videoEl.src === src && !videoEl.paused){
    setStatus(`Метка #${idx} — продолжаю видео`);
    return;
  }

  videoEl.src = src;

  try{
    await videoEl.play();
    setStatus(`Метка #${idx} — видео играет`);
  }catch(e){
    // autoplay может блокироваться — поэтому controls включены
    setStatus(`Метка #${idx} — нажми Play (автозапуск заблокирован)`);
    videoHint.textContent = "Нажми Play";
  }
}

/* Когда метка потеряна — НЕ останавливаем видео */
function onLost(idx){
  if(idx === currentIndex){
    videoHint.textContent = "Метка потеряна — видео продолжает идти";
    setStatus(`Метка #${idx} потеряна — видео продолжается`);
  }
}

/* Запуск AR */
async function startAR(){
  if (running) return;

  const sys = sceneEl.systems["mindar-image-system"];
  if(!sys){
    setStatus("Ошибка: MindAR system не найден");
    return;
  }

  try{
    setStatus("Запуск камеры…");
    await sys.start();
    running = true;
    tapEl.hidden = true;
    setStatus("Камера запущена — наведи на метку");
  }catch(e){
    // Часто: браузер требует жест или камера занята
    tapEl.hidden = false;
    setStatus("Не стартовало — кликни/тапни по экрану или проверь камеру");
    console.error(e);
  }
}

/* Инициализация */
sceneEl.addEventListener("loaded", () => {
  buildAnchors();
  setStatus("Готово — стартую камеру…");
  startAR();
});

/* Запасной старт по жесту */
async function startOnGesture(){
  await startAR();
}
window.addEventListener("click", startOnGesture, { passive:true });
window.addEventListener("touchstart", startOnGesture, { passive:true });
