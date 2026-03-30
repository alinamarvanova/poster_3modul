//нейронка — cursor
document.addEventListener("DOMContentLoaded", function () {
  // sound toggle (off by default)
  let soundBtn = document.querySelector(".sound_button");
  let ambient = document.querySelector("#poster_ambient");
  if (soundBtn && ambient) {
    ambient.loop = true;
    let soundOn = false;

    function setSound(on) {
      soundOn = on;
      soundBtn.classList.toggle("is-on", on);
      soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) {
        ambient.play().catch(() => {});
      } else {
        ambient.pause();
      }
    }

    soundBtn.addEventListener("click", () => setSound(!soundOn));
    soundBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setSound(!soundOn);
      }
    });
  }

  // fall item animation
  let container = document.querySelector(".container_fall_items");
  let items = document.querySelectorAll(".fall_item");

  let itemsData = [];

  items.forEach((item) => {
    if (!item.style.left) {
      let randomLeft = Math.random() * (container.clientWidth - 60);
      let randomTop = Math.random() * (container.clientHeight - 60);
      item.style.left = randomLeft + "px";
      item.style.top = randomTop + "px";
    }

    if (!item.style.position) {
      item.style.position = "absolute";
    }

    itemsData.push({
      element: item,
      vy: 0.5,
      vx: (Math.random() - 0.5) * 2,
      dragging: false,
    });
  });

  let dragItem = null;
  let mouseX = 0,
    mouseY = 0;

  container.addEventListener("mousemove", (e) => {
    let rect = container.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  container.addEventListener("mouseup", () => {
    if (dragItem) {
      let data = itemsData.find((d) => d.element === dragItem);
      if (data) {
        data.dragging = false;
      }
      dragItem.style.zIndex = "";
      dragItem = null;
    }
  });

  function fall() {
    itemsData.forEach((data) => {
      if (!data.dragging) {
        let left = parseFloat(data.element.style.left) || 0;
        let top = parseFloat(data.element.style.top) || 0;

        let newLeft = left + data.vx;
        let newTop = top + data.vy;

        let centerX = left + data.element.offsetWidth / 2;
        let centerY = top + data.element.offsetHeight / 2;
        let dx = centerX - mouseX;
        let dy = centerY - mouseY;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100 && !dragItem) {
          let force = ((100 - dist) / 100) * 3;
          let angle = Math.atan2(dy, dx);
          data.vx += Math.cos(angle) * force;
          data.vy += Math.sin(angle) * force;
        }

        if (newLeft < 0) {
          newLeft = 0;
          data.vx *= -0.5;
        }

        if (newLeft > container.clientWidth - data.element.offsetWidth) {
          newLeft = container.clientWidth - data.element.offsetWidth;
          data.vx *= -0.5;
        }

        if (newTop < 0) {
          newTop = 0;
          data.vy *= -0.5;
        }

        if (newTop > container.clientHeight - data.element.offsetHeight) {
          newTop = container.clientHeight - data.element.offsetHeight;
          data.vy *= -0.5;
        }

        data.element.style.left = newLeft + "px";
        data.element.style.top = newTop + "px";
      }
    });

    requestAnimationFrame(fall);
  }

  fall();

  let typeNodes = Array.from(document.querySelectorAll(".plain_text")).filter(
    (el) => !el.closest("header"),
  );

  function tokenizeHtmlWithBreaks(html) {
    let parts = html.split(/<br\s*\/?>/gi);
    let tokens = [];
    for (let i = 0; i < parts.length; i++) {
      let text = parts[i]
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
      for (let ch of text) tokens.push(ch);
      if (i !== parts.length - 1) tokens.push({ br: true });
    }
    return tokens;
  }

  function renderTokens(tokens, count) {
    let out = "";
    for (let i = 0; i < count && i < tokens.length; i++) {
      let t = tokens[i];
      out += t && t.br ? "<br>" : String(t);
    }
    return out;
  }

  function initTypewriter(el) {
    let originalHtml = el.innerHTML;
    let tokens = tokenizeHtmlWithBreaks(originalHtml);

    el.style.position = el.style.position || "relative";
    el.innerHTML = "";

    let ghost = document.createElement("span");
    ghost.innerHTML = originalHtml;
    ghost.style.visibility = "hidden";
    ghost.style.display = "inline";

    let typed = document.createElement("span");
    typed.style.position = "absolute";
    typed.style.left = "0";
    typed.style.top = "0";
    typed.style.display = "inline";

    el.appendChild(ghost);
    el.appendChild(typed);

    return { tokens, typed, i: 0, speedMs: 18 };
  }

  let typewriters = typeNodes.map((el) => ({
    el,
    started: false,
    ...initTypewriter(el),
  }));

  function runTypewriter(tw) {
    if (!tw || tw.started) return;
    tw.started = true;

    let tick = () => {
      tw.i += 1;
      tw.typed.innerHTML = renderTokens(tw.tokens, tw.i);

      if (tw.i < tw.tokens.length) {
        setTimeout(tick, tw.speedMs);
      }
    };

    tick();
  }

  let reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    for (let tw of typewriters) {
      tw.started = true;
      tw.typed.innerHTML = renderTokens(tw.tokens, tw.tokens.length);
    }
  } else {
    let io = new IntersectionObserver(
      (entries) => {
        for (let entry of entries) {
          if (!entry.isIntersecting) continue;
          let tw = typewriters.find((t) => t.el === entry.target);
          runTypewriter(tw);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.25 },
    );

    for (let tw of typewriters) io.observe(tw.el);
  }

  mouseMoveStatus();

  function mouseMoveStatus() {
    let coords = document.querySelector(".coords");
    let status = document.querySelector(".status");
    let status_coords = document.querySelector(".status_coords");

    document.addEventListener("mousemove", (event) => {
      coords.innerHTML = `x: ${event.pageX}  y: ${event.pageY}`;
    });
  }

  // стекло
  let canvas = document.querySelector(".blur_layout");
  if (canvas) {
    let glass = canvas.getContext("2d");

    function drawGreenGradientOverlay() {
      let w = canvas.width;
      let h = canvas.height;
      let cx = w / 2;
      let cy = h / 2;
      let r = Math.hypot(w, h) / 2;
      let g = glass.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "rgba(150, 152, 112, 0.7)");
      g.addColorStop(1, "rgba(109, 112, 85, 0.8)");
      g.addColorStop(1, "rgba(49, 50, 33, 0.8)");
      glass.globalCompositeOperation = "source-over";
      glass.globalAlpha = 1;
      glass.fillStyle = g;
      glass.fillRect(0, 0, w, h);
    }

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawGreenGradientOverlay();
    }
    resize();
    window.addEventListener("resize", resize);

    let finger = false;
    let lastX = 0;
    let lastY = 0;

    canvas.addEventListener("mousedown", (e) => {
      finger = true;
      lastX = e.offsetX;
      lastY = e.offsetY;
    });

    canvas.addEventListener("mouseup", () => (finger = false));
    canvas.addEventListener("mouseleave", () => (finger = false));

    canvas.addEventListener("mousemove", (e) => {
      if (!finger) return;

      let x = e.offsetX;
      let y = e.offsetY;

      glass.globalCompositeOperation = "destination-out";
      glass.lineWidth = 50;
      glass.lineCap = "round";
      glass.lineJoin = "round";

      glass.beginPath();
      glass.moveTo(lastX, lastY);
      glass.lineTo(x, y);
      glass.stroke();

      glass.globalCompositeOperation = "source-over";

      lastX = x;
      lastY = y;
    });
  }

  // sec 4
  let sec4 = document.querySelector("#sec_4");
  let gallerySec4 = document.querySelector(".photogallery_sec_4");
  if (sec4 && gallerySec4) {
    function updateGallerySec4Scroll() {
      let rect = sec4.getBoundingClientRect();
      let vh = window.innerHeight;
      let h = rect.height;
      let progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + h)));
      let xVw = -60 + 60 * progress;
      gallerySec4.style.transform = `translate3d(${xVw}vw, 0, 0)`;
    }
    updateGallerySec4Scroll();
    window.addEventListener("scroll", updateGallerySec4Scroll, {
      passive: true,
    });
    window.addEventListener("resize", updateGallerySec4Scroll);
  }

  let sec5 = document.querySelector("#sec_5");
  let sec5Canvas = document.querySelector("#sec5_canvas");

  if (sec5 && sec5Canvas) {
    let ctx = sec5Canvas.getContext("2d");
    let sec5Circles = [];
    let sec5Running = false;

    let colorPalette = [
      { r: 144, g: 137, b: 82 },
      { r: 32, g: 45, b: 21 },
      { r: 83, g: 93, b: 69 },
      { r: 153, g: 152, b: 132 },
      { r: 145, g: 162, b: 99 },
      { r: 34, g: 35, b: 30 },
      { r: 48, g: 56, b: 41 },
      { r: 57, g: 73, b: 49 },
      { r: 158, g: 169, b: 156 },
      { r: 212, g: 208, b: 185 },
      { r: 144, g: 153, b: 127 },
      { r: 121, g: 134, b: 75 },
      { r: 53, g: 64, b: 36 },
      { r: 229, g: 215, b: 196 },
    ];

    function resizeSec5Canvas() {
      let dpr = window.devicePixelRatio || 1;
      let w = sec5.clientWidth;
      let h = sec5.clientHeight;
      sec5Canvas.width = Math.round(w * dpr);
      sec5Canvas.height = Math.round(h * dpr);
      sec5Canvas.style.width = w + "px";
      sec5Canvas.style.height = h + "px";
    }

    function drawSec5Frame() {
      let dpr = window.devicePixelRatio || 1;
      let w = sec5.clientWidth;
      let h = sec5.clientHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "rgb(71, 72, 48)";
      ctx.fillRect(0, 0, w, h);

      for (let c of sec5Circles) {
        ctx.filter = `blur(${c.blur}px)`;
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, 0.78)`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.filter = "none";
        c.size += 1;
        c.blur += 0.2;
      }
    }

    function sec5Loop() {
      drawSec5Frame();
      requestAnimationFrame(sec5Loop);
    }

    function addSec5Circle(clientX, clientY) {
      let rect = sec5Canvas.getBoundingClientRect();
      let x = clientX - rect.left;
      let y = clientY - rect.top;

      let randomColor =
        colorPalette[Math.floor(Math.random() * colorPalette.length)];

      sec5Circles.push({
        x,
        y,
        size: 10,
        r: randomColor.r,
        g: randomColor.g,
        b: randomColor.b,
        blur: 0,
      });

      if (!sec5Running) {
        sec5Running = true;
        requestAnimationFrame(sec5Loop);
      }
    }

    sec5.addEventListener(
      "pointerdown",
      (e) => {
        if (e.target.closest && e.target.closest("video")) return;
        addSec5Circle(e.clientX, e.clientY);
      },
      { passive: true },
    );

    resizeSec5Canvas();
    drawSec5Frame();

    window.addEventListener("resize", () => {
      resizeSec5Canvas();
      drawSec5Frame();
    });
  }
});
