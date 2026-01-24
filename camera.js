const statusEl  = document.getElementById("status");
const hintBox   = document.getElementById("hintBox");

const startBtn  = document.getElementById("startBtn");
const stopBtn   = document.getElementById("stopBtn");
const helpBtn   = document.getElementById("helpBtn");

const errorBox  = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");

const sceneEl     = document.getElementById("scene");
const targetsRoot = document.getElementById("targetsRoot");

let running = false;

function setStatus(t){ statusEl.textContent = t; }
function showError(t){
  errorText.textContent = t || "Неизвестная ошибка";
  errorBox.hidden = false;
}
function hideError(){ errorBox.hidden = true; }

/* targets.mind лежит рядом с camera.html */
const TARGETS_URL = "./targets.mind";

/* Проверка: доступен ли файл по URL */
async function checkTargets(){
  try{
    const res = await fetch(TARGETS_URL, { cache: "no-store" });
    if (!res.ok){
      return { ok: false, msg: `targets.mind не найден по пути ${TARGETS_URL} (HTTP ${res.status})` };
    }
    return { ok: true };
  }catch(e){
    return { ok: false, msg: "fetch() не смог загрузить targets.mind. Открой страницу по http/https, а не file:// [Inference]" };
  }
}

/* Сейчас метки/видео не создаём — просто запускаем AR */
function buildTargets(){
  targetsRoot.innerHTML = "";
  // Позже тут будут <a-entity mindar-image-target="targetIndex: ..."> и a-video
}

async function startAR(){
  hideError();
  setStatus("Проверяю targets.mind…");

  const chk = await checkTargets();
  if (!chk.ok){
    showError(
      chk.msg +
      "\n\nПРОВЕРКА: открой в браузере URL вида:\n" +
      "http://localhost:5500/targets.mind\n" +
      "Если 404 — файл не там, где страница."
    );
    setStatus("AR не запущен");
    return;
  }

  buildTargets();

  const sys = sceneEl.systems["mindar-image-system"];
  if (!sys){
    showError("MindAR system не найден. Проверь, что подключился mindar-image-aframe.prod.js");
    setStatus("AR не запущен");
    return;
  }

  try{
    setStatus("Запуск AR…");
    await sys.start();

    running = true;
    startBtn.disabled = true;
    stopBtn.disabled  = false;

    setStatus("AR включён — наведите на метку");
    if (hintBox) hintBox.style.display = "none";
  }catch(e){
    showError(String(e));
    setStatus("Не удалось запустить AR");
  }
}

async function stopAR(){
  const sys = sceneEl.systems["mindar-image-system"];
  if (sys){
    try{ await sys.stop(); }catch(_){}
  }
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled  = true;
  setStatus("AR остановлен");
}

startBtn.addEventListener("click", startAR);
stopBtn.addEventListener("click", stopAR);

helpBtn.addEventListener("click", () => {
  alert(
    "Проверка:\n" +
    "1) targets.mind должен лежать рядом с camera.html\n" +
    "2) Открывай сайт через Live Server (http://localhost...), а не двойным кликом (file://)\n" +
    "3) Для проверки открой в браузере: http://localhost:5500/targets.mind"
  );
});

sceneEl.addEventListener("loaded", () => {
  setStatus("Нажмите «Включить AR»");
});
