/* =========================================================
  camera.js
  Цель:
  - НЕ вызывать start() раньше времени (иначе dummyRun / черный экран)
  - включать кнопку Start только когда сцена полностью loaded
  - показывать arReady / arError
========================================================= */

const sceneEl   = document.getElementById("scene");

const startBtn  = document.getElementById("startBtn");
const stopBtn   = document.getElementById("stopBtn");
const helpBtn   = document.getElementById("helpBtn");

const statusEl  = document.getElementById("status");

const errorBox  = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");

let arSystem = null;      // сюда положим sceneEl.systems["mindar-image-system"]
let isRunning = false;    // флаг “AR запущен”

function setStatus(text){
  statusEl.textContent = text;
}

function showError(text){
  errorText.textContent = text;
  errorBox.hidden = false;
}

function hideError(){
  errorBox.hidden = true;
}

/* Проверяем, что targets.mind реально доступен по HTTPS */
async function checkTargetsMind(){
  try{
    const res = await fetch("./targets.mind", { cache: "no-store" });
    if(!res.ok){
      return {
        ok: false,
        msg:
          `targets.mind не найден (HTTP ${res.status}).\n` +
          `Проверь, что targets.mind лежит рядом с camera.html и доступен по ссылке:\n` +
          `${location.origin}${location.pathname.replace(/\/[^/]*$/, "/")}targets.mind`
      };
    }
    return { ok: true };
  }catch(e){
    return {
      ok: false,
      msg:
        "Не удалось загрузить targets.mind через fetch().\n" +
        "Проверь, что страница открыта по https (не file://) и файл реально опубликован.\n" +
        "[Inference]"
    };
  }
}

/* ВАЖНО: получаем arSystem только после loaded */
sceneEl.addEventListener("loaded", () => {
  arSystem = sceneEl.systems["mindar-image-system"];

  if(!arSystem){
    showError("MindAR system не найден. Проверь подключение mindar-image-aframe.prod.js");
    setStatus("Ошибка загрузки");
    return;
  }

  // Теперь можно нажимать Start
  startBtn.disabled = false;
  setStatus("Нажмите «Старт AR»");
});

/* События MindAR: arReady/arError (как в примерах документации) */
sceneEl.addEventListener("arReady", () => {
  // AR реально поднялся, камера должна быть видна
  setStatus("AR включён — наведи на метку");
});

sceneEl.addEventListener("arError", (e) => {
  // Обычно это проблемы с камерой/разрешениями/устройством
  showError("MindAR не смог запуститься (arError). Проверь разрешение камеры и браузер.");
  setStatus("Ошибка AR");
});

/* Кнопка Start */
startBtn.addEventListener("click", async () => {
  hideError();

  if(!arSystem){
    showError("Сцена ещё не загрузилась. Подожди 1–2 секунды и попробуй снова.");
    return;
  }

  if(isRunning) return;

  setStatus("Проверяю targets.mind…");
  const chk = await checkTargetsMind();
  if(!chk.ok){
    showError(chk.msg);
    setStatus("AR не запущен");
    return;
  }

  try{
    setStatus("Запуск AR…");

    // Маленькая задержка, чтобы A-Frame успел закончить инициализацию (устраняет dummyRun)
    await new Promise(r => requestAnimationFrame(() => r()));

    await arSystem.start();  // запуск AR (камера включится здесь)

    isRunning = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Статус “AR включён…” выставится ещё точнее в arReady
  }catch(err){
    showError(String(err));
    setStatus("Ошибка запуска AR");
  }
});

/* Кнопка Stop */
stopBtn.addEventListener("click", async () => {
  hideError();

  if(!arSystem) return;

  try{
    await arSystem.stop();
  }catch(e){
    // не критично
  }

  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;

  setStatus("AR остановлен");
});

/* Справка */
helpBtn.addEventListener("click", () => {
  alert(
    "Если экран чёрный:\n" +
    "1) Нажми «Старт AR»\n" +
    "2) Разреши доступ к камере\n" +
    "3) Проверь, что targets.mind открывается по ссылке:\n" +
    location.origin + location.pathname.replace(/\/[^/]*$/, "/") + "targets.mind\n"
  );
});
