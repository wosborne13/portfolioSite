document.querySelectorAll(".carousel").forEach((carousel) => {
  const track = carousel.querySelector(".carousel__track");
  const prev = carousel.querySelector(".carousel__arrow--prev");
  const next = carousel.querySelector(".carousel__arrow--next");
  if (!track || !prev || !next) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cards = Array.from(track.querySelectorAll(".card"));

  const dotsEl = document.createElement("div");
  dotsEl.className = "carousel__dots";
  dotsEl.setAttribute("role", "tablist");
  dotsEl.setAttribute("aria-label", "Carousel position");
  cards.forEach((card, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel__dot";
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    dot.addEventListener("click", () => {
      card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "start" });
    });
    dotsEl.appendChild(dot);
  });
  carousel.appendChild(dotsEl);
  const dots = Array.from(dotsEl.children);

  function step() {
    const card = track.querySelector(".card");
    if (!card) return track.clientWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    return card.getBoundingClientRect().width + gap;
  }

  function updateArrows() {
    const edge = parseFloat(getComputedStyle(track).paddingLeft) + 1;
    const maxScroll = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= edge;
    next.disabled = track.scrollLeft >= maxScroll - edge;
  }

  function updateDots() {
    if (!cards.length) return;
    const trackLeft = track.getBoundingClientRect().left;
    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card, index) => {
      const dist = Math.abs(card.getBoundingClientRect().left - trackLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closest = index;
      }
    });
    dots.forEach((dot, index) => dot.classList.toggle("is-active", index === closest));
  }

  prev.addEventListener("click", () => {
    track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
  });

  next.addEventListener("click", () => {
    track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
  });

  track.addEventListener("scroll", () => {
    updateArrows();
    updateDots();
  }, { passive: true });
  window.addEventListener("resize", () => {
    updateArrows();
    updateDots();
  });
  updateArrows();
  updateDots();
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

function setupSort(selectId, gridId, sortKeys) {
  const select = document.getElementById(selectId);
  const grid = document.getElementById(gridId);
  if (!select || !grid) return;

  select.addEventListener("change", () => {
    const key = sortKeys[select.value] || sortKeys.recommended;
    const cards = Array.from(grid.children);
    cards.sort((a, b) => Number(a.dataset[key]) - Number(b.dataset[key]));
    cards.forEach((card) => grid.appendChild(card));
  });
}

setupSort("fun-sort", "fun-grid", { recommended: "order", chronological: "year", cost: "cost" });
setupSort("work-sort", "work-grid", { recommended: "order", chronological: "year" });

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

  let touchStartX = null;
  let touchStartY = null;

  overlay.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  overlay.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    touchStartX = null;
    touchStartY = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    stepLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });

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

document.querySelectorAll(".spread-viewer").forEach((viewer) => {
  const slideList = viewer.querySelector(".spread-viewer__slides");
  const stageImg = viewer.querySelector(".spread-viewer__img");
  const caption = viewer.querySelector(".spread-viewer__caption");
  const prev = viewer.querySelector(".spread-viewer__arrow--prev");
  const next = viewer.querySelector(".spread-viewer__arrow--next");
  const frame = viewer.querySelector(".spread-viewer__frame");
  if (!slideList || !stageImg || !prev || !next) return;

  const slides = Array.from(slideList.children).map((li) => {
    const img = li.querySelector("img");
    const paragraphs = Array.from(li.querySelectorAll("p")).map((p) => p.textContent.trim());
    return {
      src: img ? img.getAttribute("src") : "",
      alt: img ? img.getAttribute("alt") || "" : "",
      captions: paragraphs,
    };
  });
  if (!slides.length) return;

  let index = 0;

  function render() {
    const slide = slides[index];
    stageImg.src = slide.src;
    stageImg.alt = slide.alt;
    if (caption) {
      caption.innerHTML = "";
      slide.captions.forEach((text) => {
        const p = document.createElement("p");
        const labelMatch = text.match(/^([^:]+:)\s*(.*)$/s);
        if (labelMatch) {
          const strong = document.createElement("strong");
          strong.textContent = labelMatch[1];
          p.appendChild(strong);
          p.appendChild(document.createTextNode(" " + labelMatch[2]));
        } else {
          p.textContent = text;
        }
        caption.appendChild(p);
      });
    }
  }

  function step(delta) {
    index = (index + delta + slides.length) % slides.length;
    render();
  }

  prev.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));

  if (frame) {
    frame.addEventListener("click", (event) => {
      const rect = frame.getBoundingClientRect();
      const clickedLeftHalf = event.clientX - rect.left < rect.width / 2;
      step(clickedLeftHalf ? -1 : 1);
    });

    let touchStartX = null;
    let touchStartY = null;

    frame.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });

    frame.addEventListener("touchend", (event) => {
      if (touchStartX === null) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      touchStartX = null;
      touchStartY = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      event.preventDefault();
      step(dx < 0 ? 1 : -1);
    });
  }

  render();
});

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
