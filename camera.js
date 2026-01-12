// =========================================================
// ФАЙЛ: ar/camera.js
// Назначение:
// - Запуск камеры через getUserMedia
// - Остановка камеры
// - Понятные ошибки
// =========================================================

const videoEl   = document.getElementById("camera");
const statusEl  = document.getElementById("status");
const hintBox   = document.getElementById("hintBox");
const startBtn  = document.getElementById("startBtn");
const stopBtn   = document.getElementById("stopBtn");
const helpBtn   = document.getElementById("helpBtn");
const errorBox  = document.getElementById("errorBox");
const errorText = document.getElementById("errorText");

// Текущий поток камеры
let currentStream = null;

// Прочитаем параметр place из URL (пока просто показываем в статусе)
const params = new URLSearchParams(location.search);
const place = params.get("place"); // naumov / chulkov / palantay

function setStatus(text){
  statusEl.textContent = text;
}

function showError(message){
  errorText.textContent = message;
  errorBox.hidden = false;
}

function hideError(){
  errorBox.hidden = true;
  errorText.textContent = "";
}

function stopStream(){
  if (!currentStream) return;

  currentStream.getTracks().forEach((t) => t.stop());
  videoEl.srcObject = null;
  currentStream = null;
}

function humanizeGetUserMediaError(err){
  const name = err?.name || "";
  const msg  = err?.message || String(err);

  if (name === "NotAllowedError" || name === "PermissionDeniedError"){
    return "Доступ к камере запрещён. Разрешите камеру для сайта и обновите страницу.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError"){
    return "Камера не найдена. Проверьте устройство и не занята ли камера другим приложением.";
  }
  if (name === "NotReadableError" || name === "TrackStartError"){
    return "Не удалось запустить камеру. Закройте другие приложения, которые могут использовать камеру, и попробуйте снова.";
  }
  if (name === "SecurityError"){
    return "Камера работает только на HTTPS (GitHub Pages — это HTTPS).";
  }
  return "Ошибка запуска камеры: " + msg;
}

async function startCamera(){
  hideError();

  if (currentStream){
    setStatus("Камера уже включена ✓");
    return;
  }

  startBtn.disabled = true;
  setStatus("Запрашиваем доступ к камере…");

  try{
    const constraints = {
      video: { facingMode: { ideal: "environment" } },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;

    videoEl.srcObject = stream;

    // Иногда полезно попытаться play() явно
    await videoEl.play().catch(() => {});

    stopBtn.disabled = false;
    hintBox.style.display = "none";

    // Покажем, какое место выбрано (если пришли с карточки)
    if (place){
      setStatus(`Камера включена ✓ Место: ${place}`);
    } else {
      setStatus("Камера включена ✓ Наведите на объект");
    }

  } catch (err){
    startBtn.disabled = false;
    stopBtn.disabled = true;

    showError(humanizeGetUserMediaError(err));
    setStatus("Не удалось запустить камеру");

    stopStream();
  }
}

function stopCamera(){
  stopStream();

  stopBtn.disabled = true;
  startBtn.disabled = false;

  hintBox.style.display = "block";
  setStatus("Камера остановлена");
}

startBtn.addEventListener("click", startCamera);
stopBtn.addEventListener("click", stopCamera);

helpBtn.addEventListener("click", () => {
  alert(
    "Инструкция:\n" +
    "1) Нажмите «Включить камеру»\n" +
    "2) Разрешите доступ\n" +
    "3) Наведите на объект/метку\n\n" +
    "Дальше мы добавим распознавание и видео поверх камеры."
  );
});

window.addEventListener("beforeunload", () => {
  stopStream();
});
