/* ===== DOM ===== */
const sceneEl = document.getElementById("scene");
const targetsRoot = document.getElementById("targetsRoot");

const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const stopBtn  = document.getElementById("stopBtn");

function setStatus(t){ statusEl.textContent = t; }

let running = false;

/* Проверяем, что targets.mind доступен (лежит рядом с camera.html) */
async function checkTargets(){
  try{
    const r = await fetch("./targets.mind", { cache: "no-store" });
    if(!r.ok){
      return { ok:false, msg:`targets.mind не найден (HTTP ${r.status}). Файл должен быть рядом с camera.html` };
    }
    return { ok:true };
  }catch(e){
    return { ok:false, msg:`Не удалось загрузить targets.mind (fetch). Открывай по https/http, не file://. [Inference]` };
  }
}

/* Создаём метки 0..24 и делаем простую плашку, чтобы видеть распознавание */
function buildTargets(){
  targetsRoot.innerHTML = "";

  for(let i=0; i<=24; i++){
    const holder = document.createElement("a-entity");
    holder.setAttribute("mindar-image-target", `targetIndex: ${i}`);

    // Плашка "Метка #i" (видна только когда метка найдена)
    const plane = document.createElement("a-plane");
    plane.setAttribute("width", "0.9");
    plane.setAttribute("height", "0.18");
    plane.setAttribute("position", "0 -0.6 0");
    plane.setAttribute("material", "color:#111; opacity:0.85; transparent:true");

    const text = document.createElement("a-text");
    text.setAttribute("value", `Метка #${i}`);
    text.setAttribute("align", "center");
    text.setAttribute("color", "#fff");
    text.setAttribute("width", "2");
    text.setAttribute("position", "0 0 0.01");

    plane.appendChild(text);
    plane.object3D.visible = false;

    holder.appendChild(plane);
    targetsRoot.appendChild(holder);

    holder.addEventListener("targetFound", () => {
      plane.object3D.visible = true;
      setStatus(`Метка найдена: #${i}`);
    });

    holder.addEventListener("targetLost", () => {
      plane.object3D.visible = false;
      setStatus(`Метка потеряна: #${i}`);
    });
  }
}

/* Старт AR (по кнопке) */
async function startAR(){
  if (running) return;

  const chk = await checkTargets();
  if(!chk.ok){
    setStatus(chk.msg);
    console.error(chk.msg);
    return;
  }

  const sys = sceneEl.systems["mindar-image-system"];
  if(!sys){
    setStatus("MindAR system не найден. Проверь подключение mindar-image-aframe.prod.js. [Unverified]");
    return;
  }

  buildTargets();

  try{
    setStatus("Запуск камеры…");
    await sys.start();
    running = true;

    startBtn.disabled = true;
    stopBtn.disabled = false;

    setStatus("Камера запущена — наведи на метку");
  }catch(e){
    // Часто: камера занята или нет разрешения
    setStatus(`Не удалось запустить камеру: ${e?.name || e}. [Inference]`);
    console.error(e);
  }
}

/* Стоп AR */
async function stopAR(){
  if (!running) return;

  const sys = sceneEl.systems["mindar-image-system"];
  try{
    setStatus("Остановка…");
    await sys.stop();
  }catch(e){
    console.error(e);
  }finally{
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus("AR остановлен. Нажмите «Запустить AR»");
  }
}

/* Подключаем кнопки */
startBtn.addEventListener("click", startAR);
stopBtn.addEventListener("click", stopAR);

/* После загрузки сцены просто готовимся */
sceneEl.addEventListener("loaded", () => {
  setStatus("Нажмите «Запустить AR»");
});
