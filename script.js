const pantallas = document.querySelectorAll(".pantalla");
const musica = document.getElementById("musica");
const controlMusica = document.getElementById("control-musica");
const reproductor = document.getElementById("player");
const textoMusica = document.getElementById("texto-musica");
const contenedorCorazones = document.getElementById("corazones");

function mostrarPantalla(id) {
  pantallas.forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.getElementById("comenzar").addEventListener("click", () => {
  document.body.classList.add("entered");
  iniciarMusica();
  mostrarPantalla("historia");
});

document.getElementById("ir-carta").addEventListener("click", () => {
  mostrarPantalla("carta");
});

document.getElementById("ir-pregunta").addEventListener("click", () => {
  mostrarPantalla("pregunta");
});

// Música: el video (con el audio de la canción) arranca al pulsar "Descubrir sorpresa".
// El navegador solo permite reproducir con sonido después de un clic del usuario.
function marcarMusica(sonando) {
  reproductor.classList.toggle("playing", sonando);
  textoMusica.textContent = sonando ? "Pausar" : "Música";
  controlMusica.setAttribute("aria-label", sonando ? "Pausar música" : "Reproducir música");
}

function iniciarMusica() {
  musica.muted = false;
  musica.volume = 0.5;
  musica.currentTime = 0;
  musica.play().then(() => marcarMusica(true)).catch(() => {
    console.warn("No se pudo reproducir assets/cancion.mp4. Revisa que el archivo exista.");
    marcarMusica(false);
  });
}

function alternarMusica() {
  if (musica.paused) {
    musica.muted = false;
    musica.play().then(() => marcarMusica(true)).catch(() => {});
  } else {
    musica.pause();
    marcarMusica(false);
  }
}

controlMusica.addEventListener("click", alternarMusica);
musica.addEventListener("click", alternarMusica);

document.getElementById("sobre").addEventListener("click", (event) => {
  const sobre = event.currentTarget;
  sobre.classList.toggle("abierta");
  sobre.setAttribute("aria-expanded", sobre.classList.contains("abierta"));
});

// Datos de EmailJS (los consigues en https://www.emailjs.com). Son públicos por diseño.
// El correo del chico se configura en la plantilla de EmailJS (campo "To Email"), no aquí.
const EMAILJS_SERVICE_ID = "service_32djcpj";
const EMAILJS_TEMPLATE_ID = "template_kndmm8h";
const EMAILJS_PUBLIC_KEY = "l_Jv-oXTf_a7i6Qsm";
const NOMBRE_CHICA = "Adriana";
const NOMBRE_CHICO = "Angel";
const CLAVE_PENDIENTE = "respuesta-pendiente";

function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Envía la respuesta por correo. Reintenta hasta 3 veces por si hay un fallo de red.
async function notificar(respuesta) {
  if ([EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY].some(v => v.startsWith("PEGA_AQUI"))) {
    throw new Error("Faltan los datos de EmailJS en script.js (service id, template id y public key).");
  }

  const textoRespuesta = respuesta === "SI" ? "SÍ ❤️" : "NO";
  let ultimoError;

  for (let intento = 1; intento <= 3; intento++) {
    try {
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            nombre_chica: NOMBRE_CHICA,
            nombre_chico: NOMBRE_CHICO,
            respuesta: textoRespuesta
          }
        })
      });

      if (response.ok) return;

      const detalle = await response.text().catch(() => "");
      ultimoError = new Error(`EmailJS respondió ${response.status}: ${detalle}`);
      console.error(ultimoError.message);
      if (response.status >= 400 && response.status < 500) break;
    } catch (error) {
      ultimoError = error;
      console.error("Fallo de red al enviar el correo:", error);
    }
    await esperar(1200 * intento);
  }
  throw ultimoError;
}

// Si un envío anterior falló, se reintenta cuando la página vuelve a abrirse.
async function reintentarPendiente() {
  let pendiente = null;
  try { pendiente = localStorage.getItem(CLAVE_PENDIENTE); } catch (e) { return; }
  if (!pendiente) return;
  try {
    await notificar(pendiente);
    localStorage.removeItem(CLAVE_PENDIENTE);
  } catch (error) {
    console.error("No se pudo reenviar la respuesta pendiente:", error);
  }
}

async function enviarRespuesta(respuesta) {
  const botones = document.querySelectorAll(".boton-si, .boton-no");
  botones.forEach(b => b.disabled = true);

  let enviado = true;
  try {
    await notificar(respuesta);
  } catch (error) {
    enviado = false;
    console.error(error);
    // Se guarda para reintentar luego; así ella no se queda bloqueada en un momento tan importante.
    try { localStorage.setItem(CLAVE_PENDIENTE, respuesta); } catch (e) { /* sin almacenamiento */ }
  }

  if (respuesta === "SI") {
    mostrarPantalla("final");
    lanzarCorazones(45);
  } else {
    document.getElementById("pista-no").textContent =
      "Gracias por responder con sinceridad. ❤️";
    document.getElementById("respuesta-no").textContent = "Respuesta enviada ✓";
  }

  if (!enviado) {
    console.warn("La respuesta no llegó al correo. Revisa los datos de EmailJS.");
  }
}

document.getElementById("respuesta-si").addEventListener("click", () => {
  enviarRespuesta("SI");
});

document.getElementById("respuesta-no").addEventListener("click", () => {
  enviarRespuesta("NO");
});

reintentarPendiente();

function lanzarCorazones(cantidad = 16) {
  for (let i = 0; i < cantidad; i++) {
    const corazon = document.createElement("span");
    corazon.className = "corazon-flotante";
    corazon.textContent = Math.random() > 0.5 ? "♥" : "❤";
    corazon.style.left = Math.random() * 100 + "%";
    corazon.style.fontSize = (12 + Math.random() * 24) + "px";
    corazon.style.animationDuration = (4 + Math.random() * 4) + "s";
    corazon.style.animationDelay = (Math.random() * 1.5) + "s";
    contenedorCorazones.appendChild(corazon);
    setTimeout(() => corazon.remove(), 9000);
  }
}

// Pequeños corazones discretos durante la visita.
setInterval(() => {
  if (document.hidden) return;
  const corazon = document.createElement("span");
  corazon.className = "corazon-flotante";
  corazon.textContent = "♥";
  corazon.style.left = Math.random() * 100 + "%";
  corazon.style.fontSize = (10 + Math.random() * 14) + "px";
  corazon.style.animationDuration = (7 + Math.random() * 3) + "s";
  contenedorCorazones.appendChild(corazon);
  setTimeout(() => corazon.remove(), 11000);
}, 1100);