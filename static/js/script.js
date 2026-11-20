// 1. Menú para celular (funciona en todas las páginas)
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

function cerrarMenu() {
  if (!menu || !menuBtn) return;
  menu.classList.remove("abierto");
  menuBtn.setAttribute("aria-expanded", "false");
}

if (menuBtn && menu) {
  menuBtn.addEventListener("click", () => {
    const abierto = menu.classList.toggle("abierto");
    menuBtn.setAttribute("aria-expanded", abierto);
  });

  // Cerrar con la tecla Esc
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrarMenu();
  });

  // Cerrar al tocar fuera del menú
  document.addEventListener("click", e => {
    if (!menu.contains(e.target) && !menuBtn.contains(e.target)) cerrarMenu();
  });

  // Cerrar si la ventana se agranda (pasa a modo computadora)
  window.addEventListener("resize", () => {
    if (window.innerWidth > 700) cerrarMenu();
  });
}

// 2. Proyectos (solo existe en proyectos.html)
const lista = document.getElementById("listaProyectos");
if (lista) {
  const proyectos = [
    { icono: "🚪", titulo: "Simulacros y rutas de evacuación", texto: "Practicamos qué hacer en una emergencia y señalamos las rutas de salida." },
    { icono: "🗺️", titulo: "Mapa de zonas seguras", texto: "Identificamos los puntos de reunión y las zonas de riesgo dentro de la escuela." },
    { icono: "📣", titulo: "Campaña de prevención", texto: "Carteles y mensajes para cuidarnos entre toda la comunidad escolar." },
    { icono: "🎮", titulo: "Juego Detective de riesgos", texto: "Una actividad interactiva para aprender a reconocer peligros jugando." },
    { icono: "📝", titulo: "Buzón de reportes", texto: "Un formulario para que cualquiera avise de un riesgo o comparta su opinión." }
  ];
  proyectos.forEach(p => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";
    const titulo = document.createElement("h3");
    titulo.textContent = `${p.icono} ${p.titulo}`;
    const texto = document.createElement("p");
    texto.textContent = p.texto;
    tarjeta.append(titulo, texto);
    lista.appendChild(tarjeta);
  });
}

// 3. Formulario de contacto: valida y guarda el mensaje en el servidor (solo en contacto.html)
const form = document.getElementById("formContacto");
const respuesta = document.getElementById("respuesta");
if (form) {
  const campos = ["tipo", "nombre", "correo", "mensaje"];

  function mostrarError(campo, texto) {
    const input = form.elements[campo];
    const aviso = document.getElementById("error-" + campo);
    aviso.textContent = texto || "";
    if (texto) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function validar(d) {
    const e = {};
    if (!d.tipo) e.tipo = "Elige qué quieres enviar.";
    if (d.nombre.length < 2) e.nombre = "Escribe tu nombre.";
    if (d.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) e.correo = "El correo no parece válido.";
    if (d.mensaje.length < 10) e.mensaje = "Cuéntanos un poco más (mínimo 10 caracteres).";
    return e;
  }

  function mostrarErrores(errores) {
    campos.forEach(c => mostrarError(c, errores[c]));
    respuesta.textContent = "Revisa los campos marcados.";
    respuesta.className = "error";
    const primero = form.querySelector("[aria-invalid='true']");
    if (primero) primero.focus();
  }

  form.addEventListener("submit", async evento => {
    evento.preventDefault();
    const datos = Object.fromEntries(campos.map(c => [c, form.elements[c].value.trim()]));
    const errores = validar(datos);
    if (Object.keys(errores).length) return mostrarErrores(errores);
    campos.forEach(c => mostrarError(c, ""));

    const boton = form.querySelector("button[type='submit']");
    boton.disabled = true;
    respuesta.textContent = "Enviando…";
    respuesta.className = "";
    try {
      const r = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
      const resp = await r.json();
      if (r.ok && resp.ok) {
        respuesta.textContent = `¡Gracias, ${datos.nombre}! Tu mensaje fue guardado.`;
        respuesta.className = "ok";
        form.reset();
      } else {
        mostrarErrores(resp.errores || {});
      }
    } catch (err) {
      respuesta.textContent = "No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo otra vez.";
      respuesta.className = "error";
    } finally {
      boton.disabled = false;
    }
  });
}

// 4. Juego: encuentra los riesgos (solo existe en juego.html)
const escena = document.getElementById("escena");
if (escena) {
  const total = escena.querySelectorAll(".riesgo").length;
  const contador = document.getElementById("contador");
  const mensajeJuego = document.getElementById("mensajeJuego");
  const pista = mensajeJuego.textContent;
  let encontrados = 0;
  contador.textContent = `0 / ${total}`;

  function revisar(riesgo) {
    if (!riesgo) {
      mensajeJuego.textContent = "Ahí no hay riesgo. ¡Sigue buscando!";
      return;
    }
    if (riesgo.classList.contains("encontrado")) return;
    riesgo.classList.add("encontrado");
    riesgo.setAttribute("aria-pressed", "true");
    encontrados++;
    contador.textContent = `${encontrados} / ${total}`;
    mensajeJuego.textContent = `✔ ${riesgo.dataset.titulo}: ${riesgo.dataset.info}`;
    if (encontrados === total) mensajeJuego.textContent += " 🎉 ¡Encontraste todos los riesgos!";
  }

  escena.addEventListener("click", e => revisar(e.target.closest(".riesgo")));
  escena.addEventListener("keydown", e => {
    const riesgo = e.target.closest(".riesgo");
    if (riesgo && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      revisar(riesgo);
    }
  });

  document.getElementById("reiniciarEscena").addEventListener("click", () => {
    escena.querySelectorAll(".riesgo").forEach(r => {
      r.classList.remove("encontrado");
      r.setAttribute("aria-pressed", "false");
    });
    encontrados = 0;
    contador.textContent = `0 / ${total}`;
    mensajeJuego.textContent = pista;
  });
}

// 5. Juego: quiz de prevención (solo existe en juego.html)
const quiz = document.getElementById("quiz");
if (quiz) {
  const preguntas = [
    { p: "Suena la alarma por un sismo. ¿Qué haces?",
      o: ["Corro a la salida lo más rápido que puedo", "Mantengo la calma y sigo a mi docente a la zona de seguridad", "Me quedo junto a la ventana"], c: 1,
      e: "Se evacúa con calma y en orden: no corro, no grito, no empujo." },
    { p: "Ves un charco en el pasillo. Lo mejor es…",
      o: ["Saltarlo y seguir", "Ignorarlo, alguien lo limpiará", "Avisar a un adulto y señalar el peligro"], c: 2,
      e: "Avisar y señalizar evita que alguien resbale." },
    { p: "Un cable de un enchufe está pelado. ¿Qué haces?",
      o: ["Lo toco para acomodarlo", "Lo cubro con mi mochila", "No lo toco y aviso a un docente"], c: 2,
      e: "Un cable dañado puede dar descargas o causar un incendio. Solo personal capacitado debe repararlo." },
    { p: "¿Por qué no se deben bloquear puertas ni pasillos?",
      o: ["Porque se ve desordenado", "Porque en una emergencia hay que evacuar rápido", "No importa, siempre hay otra salida"], c: 1,
      e: "Una salida libre puede salvar segundos valiosos." },
    { p: "Hay una ventana con el vidrio roto. ¿Qué haces?",
      o: ["Me alejo y aviso a un docente o directivo", "Quito los vidrios con las manos", "La uso como atajo"], c: 0,
      e: "Los vidrios cortan. Lo correcto es alejarse y avisar para que lo reparen." },
    { p: "¿Cuál es el número de emergencias en México?",
      o: ["100", "050", "911"], c: 2,
      e: "El 911 es el número único de emergencias en todo el país." }
  ];
  let i = 0;
  let puntos = 0;

  const crear = (etiqueta, texto, clase) => {
    const n = document.createElement(etiqueta);
    if (texto) n.textContent = texto;
    if (clase) n.className = clase;
    return n;
  };
  const mezclar = arr => arr.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

  function final(enfocar) {
    const titulo = crear("h3", "¡Terminaste!");
    titulo.tabIndex = -1;
    const mensaje = puntos === preguntas.length ? "¡Excelente! Sabes cómo cuidar tu escuela."
      : puntos >= 4 ? "¡Muy bien! Repasa la página de riesgos para llegar al 6 de 6."
      : "Buen intento. Lee la página de riesgos y vuelve a jugar.";
    const otra = crear("button", "Jugar otra vez", "btn");
    otra.type = "button";
    otra.addEventListener("click", () => { i = 0; puntos = 0; mostrar(true); });
    quiz.append(titulo, crear("p", `Tu puntaje: ${puntos} de ${preguntas.length}. ${mensaje}`, "quiz-nota"), otra);
    if (enfocar) titulo.focus();
  }

  function mostrar(enfocar) {
    quiz.replaceChildren();
    if (i >= preguntas.length) return final(enfocar);
    const q = preguntas[i];
    const titulo = crear("h3", q.p);
    titulo.tabIndex = -1;
    const caja = crear("div", "", "quiz-opciones");
    const nota = crear("p", "", "quiz-nota");
    nota.setAttribute("role", "status");
    const siguiente = crear("button", i === preguntas.length - 1 ? "Ver resultado" : "Siguiente", "btn");
    siguiente.type = "button";
    siguiente.hidden = true;
    siguiente.addEventListener("click", () => { i++; mostrar(true); });

    mezclar(q.o.map((t, k) => ({ t, ok: k === q.c }))).forEach(op => {
      const b = crear("button", op.t, "quiz-opcion");
      b.type = "button";
      b.dataset.ok = op.ok;
      b.addEventListener("click", () => {
        caja.querySelectorAll("button").forEach(x => {
          x.disabled = true;
          if (x.dataset.ok === "true") x.classList.add("correcta");
        });
        if (op.ok) puntos++; else b.classList.add("incorrecta");
        nota.textContent = (op.ok ? "¡Correcto! " : "No exactamente. ") + q.e;
        siguiente.hidden = false;
        siguiente.focus();
      });
      caja.appendChild(b);
    });
    quiz.append(crear("p", `Pregunta ${i + 1} de ${preguntas.length}`, "quiz-progreso"), titulo, caja, nota, siguiente);
    if (enfocar) titulo.focus();
  }
  mostrar(false);
}