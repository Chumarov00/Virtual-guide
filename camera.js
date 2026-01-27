/* =========================================================
  ФАЙЛ: camera.js
  Цель:
  - Проверить, что targets.mind доступен
  - Запустить MindAR строго по кнопке
  - Дать понятные ошибки
========================================================= */

const sceneEl   = document.getElementById("scene");

const startBtn  = document.getElementById("startBtn");
const stopBtn   = document.getElementById("stopBtn");
const helpBtn   = document.getElementById("helpBtn");

const statusEl  = document.getElementById("status");

const errorBox  = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");

/* targets.mind лежит рядом с camera.html */
const TARGETS_URL = "./targets.mind";

/* Утилиты UI */
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

/* Проверяем, отдаётся ли файл targets.mind по HTTP/HTTPS */
async function checkTargetsMind(){
  try{
    const res = await fetch(TARGETS_URL, { cache: "no-store" });

    if(!res.ok){
      return {
        ok: false,
        msg:
          `Не найден targets.mind по пути: ${TARGETS_URL} (HTTP ${res.status}).\n` +
          `Проверь, что файл лежит рядом с camera.html и загружен на GitHub Pages.`
      };
    }

    return { ok: true };
  }catch(e){
    return {
      ok: false,
      msg:
        "fetch() не смог загрузить targets.mind.\n" +
        "Чаще всего это значит:\n" +
        "1) открыто через file:// (нужно http/https)\n" +
        "2) файл не опубликован на GitHub Pages\n" +
        "3) неправильный путь.\n" +
        "[Inference]"
    };
  }
}

/* Запуск AR */
async function startAR(){
  hideError();
  setStatus("Проверяю targets.mind…");

  const chk = await checkTargetsMind();
  if(!chk.ok){
    showError(chk.msg);
    setStatus("AR не запущен");
    return;
  }

  /* Система MindAR внутри A-Frame */
  const mindarSystem = sceneEl.systems["mindar-image-system"];
  if(!mindarSystem){
    showError(
      "MindAR system не найден.\n" +
      "Проверь подключение mindar-image-aframe.prod.js"
    );
    setStatus("AR не запущен");
    return;
  }

  try{
    setStatus("Запуск AR…");
    await mindarSystem.start(); /* ключевое: запуск по кнопке */

    startBtn.disabled = true;
    stopBtn.disabled  = false;

    setStatus("AR включён — наведи на метку");
  }catch(e){
    showError(String(e));
    setStatus("Ошибка запуска AR");
  }
}

/* Остановка AR */
async function stopAR(){
  hideError();

  const mindarSystem = sceneEl.systems["mindar-image-system"];
  if(mindarSystem){
    try{
      await mindarSystem.stop();
    }catch(e){
      // [Unverified] Некоторые браузеры могут ругаться при stop, но это не критично
    }
  }

  startBtn.disabled = false;
  stopBtn.disabled  = true;

  setStatus("AR остановлен");
}

/* Справка */
function showHelp(){
  alert(
    "Проверка публикации:\n\n" +
    "Открой в браузере прямую ссылку на файл:\n" +
    "…/targets.mind\n\n" +
    "Если скачивается/открывается — значит путь ок.\n\n" +
    "Для GitHub Pages нужен файл .nojekyll (без .txt), чтобы не было сюрпризов."
  );
}

/* События кнопок */
startBtn.addEventListener("click", startAR);
stopBtn.addEventListener("click", stopAR);
helpBtn.addEventListener("click", showHelp);

/* Стартовый статус */
sceneEl.addEventListener("loaded", () => {
  setStatus("Нажмите «Старт AR»");
});
