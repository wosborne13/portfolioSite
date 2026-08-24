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
      <img class="lightbox__img" alt="" draggable="false">
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

  stageImg.draggable = false;

  const slideImages = Array.from(slideList.children).map((li) => li.querySelector("img")).filter(Boolean);
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
      const fraction = (event.clientX - rect.left) / rect.width;
      if (fraction < 0.25) {
        step(-1);
      } else if (fraction > 0.75) {
        step(1);
      } else {
        openLightbox(slideImages, index);
      }
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

function wireLightboxImages(images) {
  images.forEach((img, index) => {
    img.setAttribute("role", "button");
    img.setAttribute("tabindex", "0");
    // Images are natively draggable; without this, a real click that drifts
    // a pixel or two between mousedown and mouseup starts a drag instead of
    // firing "click", which silently swallows the lightbox open.
    img.draggable = false;
    img.addEventListener("click", () => openLightbox(images, index));
    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(images, index);
      }
    });
  });
}

document.querySelectorAll(".gallery").forEach((gallery) => {
  wireLightboxImages(Array.from(gallery.querySelectorAll("img")));
});

document.querySelectorAll(".project-figure--lightbox").forEach((figure) => {
  const img = figure.querySelector("img");
  if (img) wireLightboxImages([img]);
});

/* -------------------------------------------------- */
/* Zoom viewer (click-to-pan/zoom figure)              */
/* -------------------------------------------------- */
let zoomEl = null;
let zoomState = null;

function buildZoomViewer() {
  const overlay = document.createElement("div");
  overlay.className = "zoom-viewer";
  overlay.innerHTML = `
    <button type="button" class="lightbox__close zoom-viewer__close" aria-label="Close">✕</button>
    <div class="zoom-viewer__viewport">
      <img class="zoom-viewer__img" alt="">
    </div>
    <div class="zoom-viewer__zoom">
      <button type="button" class="zoom-viewer__zoom-btn" data-zoom="in" aria-label="Zoom in">+</button>
      <button type="button" class="zoom-viewer__zoom-btn" data-zoom="out" aria-label="Zoom out">−</button>
    </div>
    <p class="zoom-viewer__hint">Drag to pan · Scroll or pinch to zoom</p>
  `;
  document.body.appendChild(overlay);

  const viewport = overlay.querySelector(".zoom-viewer__viewport");
  const img = overlay.querySelector(".zoom-viewer__img");
  const hint = overlay.querySelector(".zoom-viewer__hint");

  overlay.querySelector(".zoom-viewer__close").addEventListener("click", closeZoomViewer);

  function hideHint() {
    hint.classList.add("is-hidden");
  }

  function clamp() {
    const s = zoomState;
    const scaledW = s.naturalWidth * s.scale;
    const scaledH = s.naturalHeight * s.scale;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    s.tx = scaledW <= vw ? (vw - scaledW) / 2 : Math.min(0, Math.max(vw - scaledW, s.tx));
    s.ty = scaledH <= vh ? (vh - scaledH) / 2 : Math.min(0, Math.max(vh - scaledH, s.ty));
  }

  function render() {
    img.style.transform = `translate(${zoomState.tx}px, ${zoomState.ty}px) scale(${zoomState.scale})`;
  }

  function zoomAt(px, py, newScale) {
    const s = zoomState;
    const clamped = Math.min(s.maxScale, Math.max(s.minScale, newScale));
    const ratio = clamped / s.scale;
    s.tx = px - (px - s.tx) * ratio;
    s.ty = py - (py - s.ty) * ratio;
    s.scale = clamped;
    clamp();
    render();
  }

  viewport.addEventListener("wheel", (event) => {
    if (!zoomState) return;
    event.preventDefault();
    hideHint();
    const rect = viewport.getBoundingClientRect();
    const factor = event.deltaY < 0 ? 1.2 : 1 / 1.2;
    zoomAt(event.clientX - rect.left, event.clientY - rect.top, zoomState.scale * factor);
  }, { passive: false });

  overlay.querySelectorAll(".zoom-viewer__zoom-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!zoomState) return;
      hideHint();
      const rect = viewport.getBoundingClientRect();
      const factor = btn.dataset.zoom === "in" ? 1.4 : 1 / 1.4;
      zoomAt(rect.width / 2, rect.height / 2, zoomState.scale * factor);
    });
  });

  const pointers = new Map();
  let lastMid = null;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let gestureHasPinched = false;
  let dragStart = null;
  let lastTapTime = 0;

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function mid(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  viewport.addEventListener("pointerdown", (event) => {
    if (!zoomState) return;
    try {
      viewport.setPointerCapture(event.pointerId);
    } catch (err) {
      /* ignore - pointer capture is a nice-to-have, not required for pan/zoom to work */
    }
    const rect = viewport.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointers.set(event.pointerId, point);
    hideHint();
    viewport.classList.add("is-dragging");
    if (pointers.size === 1) {
      dragStart = point;
    }
    if (pointers.size === 2) {
      gestureHasPinched = true;
      const pts = Array.from(pointers.values());
      pinchStartDist = dist(pts[0], pts[1]);
      pinchStartScale = zoomState.scale;
      lastMid = mid(pts[0], pts[1]);
    }
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!zoomState || !pointers.has(event.pointerId)) return;
    const rect = viewport.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const prev = pointers.get(event.pointerId);
    pointers.set(event.pointerId, point);

    if (pointers.size === 1) {
      zoomState.tx += point.x - prev.x;
      zoomState.ty += point.y - prev.y;
      clamp();
      render();
    } else if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      const newMid = mid(pts[0], pts[1]);
      const newDist = dist(pts[0], pts[1]);
      zoomState.tx += newMid.x - lastMid.x;
      zoomState.ty += newMid.y - lastMid.y;
      lastMid = newMid;
      const targetScale = pinchStartScale * (newDist / pinchStartDist);
      zoomAt(newMid.x, newMid.y, targetScale);
    }
  });

  function endPointer(event) {
    if (!zoomState) {
      pointers.delete(event.pointerId);
      return;
    }
    const rect = viewport.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointers.delete(event.pointerId);

    if (pointers.size === 0) {
      viewport.classList.remove("is-dragging");
      // Only treat this as a tap (for double-tap-to-zoom) if the gesture never
      // involved a second finger and the pointer didn't move far — a pinch's
      // two near-simultaneous finger-lifts must never be read as a double-tap.
      const moved = dragStart ? Math.hypot(point.x - dragStart.x, point.y - dragStart.y) : Infinity;
      if (!gestureHasPinched && moved < 10) {
        const now = Date.now();
        if (now - lastTapTime < 350) {
          const target = zoomState.scale > zoomState.minScale * 1.5 ? zoomState.minScale : zoomState.minScale * 3;
          zoomAt(point.x, point.y, target);
          lastTapTime = 0;
        } else {
          lastTapTime = now;
        }
      } else {
        lastTapTime = 0;
      }
      gestureHasPinched = false;
      dragStart = null;
    } else if (pointers.size === 1) {
      pinchStartDist = 0;
      lastMid = null;
      dragStart = Array.from(pointers.values())[0];
    }
  }

  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  window.addEventListener("resize", () => {
    if (!zoomState) return;
    clamp();
    render();
  });

  overlay._api = { clamp, render, zoomAt, imgEl: img, hintEl: hint };
  return overlay;
}

function openZoomViewer(trigger) {
  const img = trigger.querySelector("img");
  if (!img) return;
  if (!zoomEl) zoomEl = buildZoomViewer();

  const zoomImg = zoomEl.querySelector(".zoom-viewer__img");
  zoomImg.src = img.currentSrc || img.src;
  zoomImg.alt = img.alt || "";
  zoomEl.querySelector(".zoom-viewer__hint").classList.remove("is-hidden");
  zoomEl.classList.add("is-open");
  document.body.classList.add("zoom-open");
  document.addEventListener("keydown", onZoomKeydown);
  zoomEl.querySelector(".zoom-viewer__close").focus();

  const naturalReady = () => {
    const viewport = zoomEl.querySelector(".zoom-viewer__viewport");
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const naturalWidth = zoomImg.naturalWidth;
    const naturalHeight = zoomImg.naturalHeight;
    const fitScale = Math.min(vw / naturalWidth, vh / naturalHeight);
    zoomState = {
      naturalWidth,
      naturalHeight,
      scale: fitScale,
      minScale: fitScale,
      maxScale: fitScale * 6,
      tx: (vw - naturalWidth * fitScale) / 2,
      ty: (vh - naturalHeight * fitScale) / 2,
      trigger,
    };
    zoomEl._api.render();
  };

  if (zoomImg.complete && zoomImg.naturalWidth) {
    naturalReady();
  } else {
    zoomImg.onload = naturalReady;
  }
}

function closeZoomViewer() {
  if (!zoomEl) return;
  zoomEl.classList.remove("is-open");
  document.body.classList.remove("zoom-open");
  document.removeEventListener("keydown", onZoomKeydown);
  if (zoomState && zoomState.trigger && typeof zoomState.trigger.focus === "function") {
    zoomState.trigger.focus();
  }
  zoomState = null;
}

function onZoomKeydown(event) {
  if (event.key === "Escape") closeZoomViewer();
}

document.querySelectorAll(".zoom-figure__trigger").forEach((trigger) => {
  const triggerImg = trigger.querySelector("img");
  if (triggerImg) triggerImg.draggable = false;
  trigger.addEventListener("click", () => openZoomViewer(trigger));
});
