/* =========================================================
  camera.js (диагностика + распознавание + видео)
  ВАЖНО: autoStart=false, потому что многим браузерам нужен жест.
========================================================= */

const sceneEl     = document.getElementById("scene");
const anchorsRoot = document.getElementById("anchors");

const d1 = document.getElementById("d1");
const d2 = document.getElementById("d2");
const d3 = document.getElementById("d3");
const d4 = document.getElementById("d4");
const dHint = document.getElementById("dHint");

const tapToStart = document.getElementById("tapToStart");

const videoPanel = document.getElementById("videoPanel");
const videoTitle = document.getElementById("videoTitle");
const videoHint  = document.getElementById("videoHint");
const videoEl    = document.getElementById("arVideo");

d1.textContent = "1) camera.js загружен ✅";

/* ======= НАСТРОЙ: ссылки на видео =======
   ВНИМАНИЕ:
   Ссылки вида github.com/.../blob/...mp4 = HTML-страница GitHub, видео не проиграется.
   Нужны ПРЯМЫЕ mp4 по GitHub Pages или локально в репо.
   Я ставлю GitHub Pages вариант. Если mp4 у тебя лежат в корне репо Virtual-guide — это должно работать. [Unverified]
*/
const VIDEO_URLS = {
  bulygin: "https://chumarov00.github.io/Virtual-guide/Bulygin%27s%20House.mp4",
  naumov:  "https://chumarov00.github.io/Virtual-guide/Naumov%27s%20house.mp4",
  pchelin: "https://chumarov00.github.io/Virtual-guide/Pchelin%27s%20House.MP4",
};

function groupByIndex(i){
  if (i >= 0 && i <= 7)   return "bulygin";
  if (i >= 8 && i <= 14)  return "naumov";
  if (i >= 15 && i <= 24) return "pchelin";
  return null;
}

let currentGroup = null;
let currentIndex = null;

/* Проверяем, что targets.mind реально отдается */
async function checkTargets(){
  const url = new URL("./targets.mind", location.href).toString();
  try{
    const r = await fetch(url, { cache: "no-store" });
    if(!r.ok){
      d2.textContent = `2) targets.mind ❌ HTTP ${r.status}`;
      dHint.textContent = `Открой вручную: ${url}`;
      return false;
    }
    d2.textContent = "2) targets.mind ✅ доступен";
    return true;
  }catch(e){
    d2.textContent = "2) targets.mind ❌ fetch blocked";
    dHint.textContent = "Проверь HTTPS и что файл реально опубликован.";
    return false;
  }
}

/* Создаем anchors 0..24 */
function buildAnchors(){
  for(let i=0;i<=24;i++){
    const a = document.createElement("a-entity");
    a.setAttribute("mindar-image-target", `targetIndex: ${i}`);

    a.addEventListener("targetFound", () => onFound(i));
    a.addEventListener("targetLost",  () => onLost(i));

    anchorsRoot.appendChild(a);
  }
}

async function onFound(idx){
  const group = groupByIndex(idx);
  if(!group) return;

  const src = VIDEO_URLS[group];
  videoPanel.hidden = false;
  videoTitle.textContent = `Видео: ${group} (метка #${idx})`;
  videoHint.textContent = "Метка найдена";

  // если уже это видео играет — не дергаем
  if(currentGroup === group && !videoEl.paused){
    currentIndex = idx;
    return;
  }

  currentGroup = group;
  currentIndex = idx;

  videoEl.src = src;

  try{
    await videoEl.play();
  }catch(e){
    // autoplay может блокироваться, controls оставлены чтобы нажали Play
    videoHint.textContent = "Нажми Play (автозапуск заблокирован)";
  }
}

function onLost(idx){
  if(idx === currentIndex){
    videoHint.textContent = "Метка потеряна — видео продолжает идти";
  }
  // НИЧЕГО не останавливаем
}

/* Запуск MindAR */
async function startAR(){
  const sys = sceneEl.systems["mindar-image-system"];
  if(!sys){
    d3.textContent = "3) MindAR system ❌ не найден";
    dHint.textContent = "Проверь подключение mindar-image-aframe.prod.js";
    return;
  }
  d3.textContent = "3) MindAR system ✅ найден";

  try{
    d4.textContent = "4) Запуск камеры…";
    await sys.start();
    d4.textContent = "4) Камера запущена ✅ Сканируй метку";
    tapToStart.hidden = true;
  }catch(e){
    d4.textContent = "4) Камера ❌ не стартовала";
    tapToStart.hidden = false;
    dHint.textContent =
      "Браузер мог потребовать жест (тап/клик) или камера занята другим приложением.\n" +
      "Кликни по экрану. Если не поможет — смотри Console: NotReadableError/NotAllowedError.";
    console.error(e);
  }
}

/* Инициализация */
sceneEl.addEventListener("loaded", async () => {
  buildAnchors();

  const ok = await checkTargets();
  if(!ok) return;

  // Пытаемся стартовать сразу
  await startAR();
});

/* Запасной запуск по первому тапу/клику (это НЕ кнопка) */
async function tryStartOnGesture(){
  await startAR();
}
window.addEventListener("click", tryStartOnGesture, { passive: true });
window.addEventListener("touchstart", tryStartOnGesture, { passive: true });
