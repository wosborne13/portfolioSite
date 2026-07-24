document.querySelectorAll(".carousel").forEach((carousel) => {
  const track = carousel.querySelector(".carousel__track");
  const prev = carousel.querySelector(".carousel__arrow--prev");
  const next = carousel.querySelector(".carousel__arrow--next");
  if (!track || !prev || !next) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function step() {
    const card = track.querySelector(".card");
    if (!card) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    return card.getBoundingClientRect().width + gap;
  }

  function updateArrows() {
    const maxScroll = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= maxScroll - 1;
  }

  prev.addEventListener("click", () => {
    track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
  });

  next.addEventListener("click", () => {
    track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
  });

  track.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  updateArrows();
});

document.querySelectorAll(".gate-teaser").forEach((teaser) => {
  if (window.workGate && workGate.isUnlocked()) {
    teaser.classList.add("is-unlocked");
    return;
  }

  const trigger = teaser.querySelector(".gate-teaser__trigger");
  const form = teaser.querySelector(".gate-teaser__form");
  const input = teaser.querySelector(".gate-teaser__input");
  const error = teaser.querySelector(".gate-teaser__error");
  if (!trigger || !form || !input || !error) return;

  trigger.addEventListener("click", () => {
    trigger.hidden = true;
    form.hidden = false;
    input.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (window.workGate && workGate.checkPassword(input.value)) {
      workGate.unlock();
      teaser.classList.add("is-unlocked");
    } else {
      error.hidden = false;
      input.value = "";
      input.focus();
    }
  });
});

const funSort = document.getElementById("fun-sort");
const funGrid = document.getElementById("fun-grid");

if (funSort && funGrid) {
  const sortKeys = {
    recommended: "order",
    chronological: "year",
    cost: "cost",
  };

  funSort.addEventListener("change", () => {
    const key = sortKeys[funSort.value] || "order";
    const cards = Array.from(funGrid.children);
    cards.sort((a, b) => Number(a.dataset[key]) - Number(b.dataset[key]));
    cards.forEach((card) => funGrid.appendChild(card));
  });
}

let lightboxEl = null;
let lightboxState = null;

function buildLightbox() {
  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.innerHTML = `
    <button type="button" class="lightbox__close" aria-label="Close">✕</button>
    <button type="button" class="lightbox__arrow lightbox__arrow--prev" aria-label="Previous image">‹</button>
    <figure class="lightbox__figure">
      <img class="lightbox__img" alt="">
    </figure>
    <button type="button" class="lightbox__arrow lightbox__arrow--next" aria-label="Next image">›</button>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeLightbox();
  });
  overlay.querySelector(".lightbox__close").addEventListener("click", closeLightbox);
  overlay.querySelector(".lightbox__arrow--prev").addEventListener("click", () => stepLightbox(-1));
  overlay.querySelector(".lightbox__arrow--next").addEventListener("click", () => stepLightbox(1));

  return overlay;
}

function renderLightbox() {
  if (!lightboxEl || !lightboxState) return;
  const { images, index } = lightboxState;
  const activeImg = images[index];
  const lbImg = lightboxEl.querySelector(".lightbox__img");
  lbImg.src = activeImg.currentSrc || activeImg.src;
  lbImg.alt = activeImg.alt || "";

  const multi = images.length > 1;
  lightboxEl.querySelector(".lightbox__arrow--prev").hidden = !multi;
  lightboxEl.querySelector(".lightbox__arrow--next").hidden = !multi;
}

function stepLightbox(delta) {
  if (!lightboxState) return;
  const { images } = lightboxState;
  lightboxState.index = (lightboxState.index + delta + images.length) % images.length;
  renderLightbox();
}

function onLightboxKeydown(event) {
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") stepLightbox(-1);
  if (event.key === "ArrowRight") stepLightbox(1);
}

function openLightbox(images, index) {
  if (!lightboxEl) lightboxEl = buildLightbox();
  lightboxState = { images, index, trigger: document.activeElement };
  renderLightbox();
  lightboxEl.classList.add("is-open");
  document.body.classList.add("lightbox-open");
  document.addEventListener("keydown", onLightboxKeydown);
  lightboxEl.querySelector(".lightbox__close").focus();
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove("is-open");
  document.body.classList.remove("lightbox-open");
  document.removeEventListener("keydown", onLightboxKeydown);
  if (lightboxState && lightboxState.trigger && typeof lightboxState.trigger.focus === "function") {
    lightboxState.trigger.focus();
  }
  lightboxState = null;
}

document.querySelectorAll(".gallery").forEach((gallery) => {
  const images = Array.from(gallery.querySelectorAll("img"));
  images.forEach((img, index) => {
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    img.addEventListener("click", () => openLightbox(images, index));
    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(images, index);
      }
    });
  });
});
