(function () {
  var STORAGE_KEY = "work-gate-unlocked";
  var PASSWORD = "ishouldhirehim";

  function isUnlocked() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }

  function checkPassword(value) {
    return value === PASSWORD;
  }

  function unlock() {
    localStorage.setItem(STORAGE_KEY, "1");
    document.documentElement.classList.add("is-unlocked");
  }

  window.workGate = { isUnlocked: isUnlocked, checkPassword: checkPassword, unlock: unlock };

  if (isUnlocked()) {
    document.documentElement.classList.add("is-unlocked");
    return;
  }

  var mode = document.currentScript && document.currentScript.getAttribute("data-mode");
  if (mode === "teaser") return;

  document.addEventListener("DOMContentLoaded", function () {
    var overlay = document.createElement("div");
    overlay.className = "gate-overlay";
    overlay.innerHTML =
      '<form class="gate-form">' +
        '<p class="u-caption gate-form__label">Password, please.</p>' +
        '<h1 class="gate-form__title">Enter the password from Wil\'s resume to view this content<span class="dot"></span></h1>' +
        '<div class="gate-form__row">' +
          '<input type="password" class="gate-form__input" id="gate-password" autocomplete="off" placeholder="Password">' +
          '<button type="submit" class="btn">Enter</button>' +
        '</div>' +
        '<p class="gate-form__error" hidden>Incorrect password — try again.</p>' +
      '</form>';
    document.body.appendChild(overlay);

    var form = overlay.querySelector(".gate-form");
    var input = overlay.querySelector("#gate-password");
    var error = overlay.querySelector(".gate-form__error");

    input.focus();

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (checkPassword(input.value)) {
        unlock();
        overlay.remove();
      } else {
        error.hidden = false;
        input.value = "";
        input.focus();
      }
    });
  });
})();
