// Botón "No" que huye: cada vez que intentan presionarlo se mueve a otro lugar y se hace más
// chiquito, mientras el botón "Sí" crece. Solo se puede responder con el "Sí".
// Este archivo es independiente: solo hay que cargarlo después de script.js.
(function () {
  const si = document.getElementById("respuesta-si");
  const no = document.getElementById("respuesta-no");
  const pista = document.getElementById("pista-no");
  if (!si || !no) return;

  const FRASES = [
    "Ese botón está algo tímido 🙈",
    "Uy, se escapó 😏",
    "Intenta otra vez... o mejor no 😌",
    "No te va a dejar, mejor presiona el SÍ ❤️",
    "Cada vez está más difícil 🙊",
    "El SÍ te está esperando ❤️"
  ];

  const MARGEN = 12;          // distancia mínima a los bordes de la pantalla
  const ESCALA_NO_MIN = 0.25; // tamaño mínimo del "No"
  const PASO_NO = 0.82;       // cuánto se encoge el "No" cada vez
  const PASO_SI = 1.18;       // cuánto crece el "Sí" cada vez
  const ESCALA_SI_MAX = 2.8;  // tamaño máximo del "Sí"

  let escalaNo = 1;
  let escalaSi = 1;
  let intentos = 0;
  let ultimo = 0;
  let separado = false;

  function aleatorio(min, max) {
    return min + Math.random() * Math.max(0, max - min);
  }

  function intersecta(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function esquivar() {
    const ahora = Date.now();
    if (ahora - ultimo < 250) return; // evita que varios eventos seguidos cuenten como uno solo
    ultimo = ahora;
    intentos++;

    // Tamaños nuevos
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxSi = Math.min(ESCALA_SI_MAX, (vw - 40) / si.offsetWidth);
    escalaSi = Math.min(maxSi, escalaSi * PASO_SI);
    escalaNo = Math.max(ESCALA_NO_MIN, escalaNo * PASO_NO);

    // El "Sí" crece desde su centro, así que calculamos el área que va a ocupar
    const r = si.getBoundingClientRect();
    const cxSi = r.left + r.width / 2;
    const cySi = r.top + r.height / 2;
    const wSi = si.offsetWidth * escalaSi + 24;
    const hSi = si.offsetHeight * escalaSi + 24;
    const areaSi = {
      left: cxSi - wSi / 2, right: cxSi + wSi / 2,
      top: cySi - hSi / 2, bottom: cySi + hSi / 2
    };

    // El "No" pasa a ser un elemento flotante sobre toda la página
    if (!separado) {
      document.body.appendChild(no);
      no.style.position = "fixed";
      no.style.margin = "0";
      no.style.zIndex = "9998";
      no.style.transition = "left .35s ease, top .35s ease, transform .35s ease";
      separado = true;
    }

    const w = no.offsetWidth * escalaNo;
    const h = no.offsetHeight * escalaNo;

    // Busca un lugar al azar que no tape al "Sí" ni quede fuera de la pantalla
    let cx = vw / 2;
    let cy = vh / 2;
    let encontrado = false;
    for (let i = 0; i < 40; i++) {
      const px = aleatorio(MARGEN + w / 2, vw - MARGEN - w / 2);
      const py = aleatorio(MARGEN + h / 2, vh - MARGEN - h / 2);
      const area = { left: px - w / 2, right: px + w / 2, top: py - h / 2, bottom: py + h / 2 };
      if (!intersecta(area, areaSi)) {
        cx = px;
        cy = py;
        encontrado = true;
        break;
      }
    }
    if (!encontrado) {
      // Si no hay lugar libre, se va a la esquina más lejana del "Sí"
      cx = cxSi < vw / 2 ? vw - MARGEN - w / 2 : MARGEN + w / 2;
      cy = cySi < vh / 2 ? vh - MARGEN - h / 2 : MARGEN + h / 2;
    }

    no.style.left = (cx - no.offsetWidth / 2) + "px";
    no.style.top = (cy - no.offsetHeight / 2) + "px";
    no.style.transform = "scale(" + escalaNo + ")";
    si.style.transform = "scale(" + escalaSi + ")";

    if (pista) pista.textContent = FRASES[(intentos - 1) % FRASES.length];
  }

  // Mouse: huye cuando el cursor se acerca
  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    const r = no.getBoundingClientRect();
    const cerca = 70;
    if (e.clientX > r.left - cerca && e.clientX < r.right + cerca &&
        e.clientY > r.top - cerca && e.clientY < r.bottom + cerca &&
        document.getElementById("pregunta").classList.contains("activa")) {
      esquivar();
    }
  });

  // Celular: huye en cuanto lo tocan, antes de que cuente como clic
  no.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    esquivar();
  });
  no.addEventListener("touchstart", function (e) {
    e.preventDefault();
    esquivar();
  }, { passive: false });

  // Teclado (Tab + Enter): también huye
  no.addEventListener("focus", esquivar);

  // Red de seguridad: un clic en "No" nunca llega a enviar la respuesta
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("#respuesta-no")) {
      e.preventDefault();
      e.stopPropagation();
      esquivar();
    }
  }, true);

  // Al elegir "Sí", el "No" desaparece para que no quede flotando en la pantalla final
  si.addEventListener("click", function () {
    no.style.display = "none";
  });
})();