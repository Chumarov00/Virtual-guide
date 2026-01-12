// =========================
// ФАЙЛ: header.js
// Назначение:
// - бургер-меню для мобилок
// - временная "Справка" (alert)
// Потом заменим alert на нормальную модалку в стиле сайта.
// =========================
(function () {
  const burger = document.querySelector(".burger");
  const drawer = document.querySelector(".drawer");
  const helpBtn = document.getElementById("helpBtn");

  // Если на странице нет шапки — ничего не делаем
  if (!burger || !drawer) return;

  // Переключение мобильного меню
  burger.addEventListener("click", () => {
    const isOpen = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!isOpen));
    drawer.hidden = isOpen; // если было открыто — скрываем, если было скрыто — показываем
  });

  // Закрываем меню при клике по пункту
  drawer.addEventListener("click", (e) => {
    const link = e.target.closest("a");
    if (!link) return;
    burger.setAttribute("aria-expanded", "false");
    drawer.hidden = true;
  });

  // Временная справка
  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      alert(
        "Инструкция:\n" +
        "1) Выберите объект внизу или нажмите «Запустить камеру».\n" +
        "2) Разрешите камеру.\n" +
        "3) Наведите на метку.\n" +
        "4) Если видео не стартует — нажмите Play.\n\n" +
        "Наслаждайтесь тенями прошлого."
      );
    });
  }
})();
