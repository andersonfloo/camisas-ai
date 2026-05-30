const subirImagen = document.getElementById("subirImagen");
const diseno = document.getElementById("diseno");
const camisa = document.getElementById("camisa");
const zonaDiseno = document.getElementById("zonaDiseno");
const capturaArea = document.getElementById("capturaArea");

const eliminarDiseno = document.getElementById("eliminarDiseno");
const vistaPrevia = document.getElementById("vistaPrevia");
const modalPreview = document.getElementById("modalPreview");
const previewImage = document.getElementById("previewImage");
const cerrarPreview = document.getElementById("cerrarPreview");
const descargarPNG = document.getElementById("descargarPNG");

const REF_ZONA_ANCHO = 220;
const REF_ESCALA = 160;
const REF_POS_X = 30;
const REF_POS_Y = 30;
const ESCALA_MIN = 50;
const ESCALA_MAX = 280;

let escalaRatio = REF_ESCALA / REF_ZONA_ANCHO;
let posRatioX = REF_POS_X / REF_ZONA_ANCHO;
let posRatioY = REF_POS_Y / 260;
let ultimoCanvas = null;
let resizeTimer = null;

const gesto = {
    arrastrando: false,
    pellizcando: false,
    offsetX: 0,
    offsetY: 0,
    distInicial: 0,
    ratioInicial: 0,
    ultimoToque: 0
};

function disenoVisible() {
    return diseno.style.display !== "none" && Boolean(diseno.src);
}

function esEventoFantasma() {
    return Date.now() - gesto.ultimoToque < 600;
}

function distanciaToques(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
}

function obtenerLimitesDiseno() {
    const zonaAncho = zonaDiseno.offsetWidth;
    const zonaAlto = zonaDiseno.offsetHeight;
    const disenoAncho = diseno.offsetWidth;
    const disenoAlto = diseno.offsetHeight;

    return {
        zonaAncho,
        zonaAlto,
        disenoAncho,
        disenoAlto,
        maxX: Math.max(0, zonaAncho - disenoAncho),
        maxY: Math.max(0, zonaAlto - disenoAlto)
    };
}

function clampRatio(ratio) {
    const minRatio = ESCALA_MIN / REF_ZONA_ANCHO;
    const maxRatio = ESCALA_MAX / REF_ZONA_ANCHO;
    return Math.min(maxRatio, Math.max(minRatio, ratio));
}

function fijarPosicion(x, y) {
    const { maxX, maxY, zonaAncho, zonaAlto } = obtenerLimitesDiseno();

    let posX = Math.max(0, Math.min(maxX, x));
    let posY = Math.max(0, Math.min(maxY, y));

    diseno.style.left = posX + "px";
    diseno.style.top = posY + "px";

    posRatioX = zonaAncho > 0 ? posX / zonaAncho : 0;
    posRatioY = zonaAlto > 0 ? posY / zonaAlto : 0;
}

function fijarEscala(nuevoRatio) {
    escalaRatio = clampRatio(nuevoRatio);
    diseno.style.width = escalaRatio * zonaDiseno.offsetWidth + "px";

    const posX = parseFloat(diseno.style.left) || 0;
    const posY = parseFloat(diseno.style.top) || 0;

    fijarPosicion(posX, posY);
}

function aplicarLayoutDiseno() {
    if (!disenoVisible()) {
        return;
    }

    fijarEscala(escalaRatio);

    const { zonaAncho, zonaAlto } = obtenerLimitesDiseno();

    fijarPosicion(posRatioX * zonaAncho, posRatioY * zonaAlto);
}

function resetearDiseno() {
    escalaRatio = REF_ESCALA / REF_ZONA_ANCHO;
    posRatioX = REF_POS_X / REF_ZONA_ANCHO;
    posRatioY = REF_POS_Y / 260;
    aplicarLayoutDiseno();
}

function iniciarArrastre(clientX, clientY) {
    if (!disenoVisible()) {
        return;
    }

    const rect = zonaDiseno.getBoundingClientRect();
    const posX = parseFloat(diseno.style.left) || 0;
    const posY = parseFloat(diseno.style.top) || 0;

    gesto.offsetX = clientX - rect.left - posX;
    gesto.offsetY = clientY - rect.top - posY;
    gesto.arrastrando = true;
    gesto.pellizcando = false;
    diseno.style.cursor = "grabbing";
}

function moverDiseno(clientX, clientY) {
    if (!gesto.arrastrando || !disenoVisible()) {
        return;
    }

    const rect = zonaDiseno.getBoundingClientRect();

    fijarPosicion(
        clientX - rect.left - gesto.offsetX,
        clientY - rect.top - gesto.offsetY
    );
}

function detenerArrastre() {
    gesto.arrastrando = false;
    diseno.style.cursor = "grab";
}

function iniciarPellizco(touches) {
    if (!disenoVisible()) {
        return;
    }

    gesto.pellizcando = true;
    gesto.arrastrando = false;
    gesto.distInicial = distanciaToques(touches);
    gesto.ratioInicial = escalaRatio;
}

function actualizarPellizco(touches) {
    if (!gesto.pellizcando || !disenoVisible() || gesto.distInicial <= 0) {
        return;
    }

    const distActual = distanciaToques(touches);
    const factor = distActual / gesto.distInicial;

    fijarEscala(gesto.ratioInicial * factor);
}

function detenerPellizco() {
    gesto.pellizcando = false;
    gesto.distInicial = 0;
}

function escalarConRueda(deltaY) {
    if (!disenoVisible()) {
        return;
    }

    const paso = 10 / REF_ZONA_ANCHO;

    if (deltaY < 0) {
        fijarEscala(escalaRatio + paso);
    } else {
        fijarEscala(escalaRatio - paso);
    }
}

function manejarInicioToque(e) {
    if (!disenoVisible()) {
        return;
    }

    gesto.ultimoToque = Date.now();

    if (e.touches.length === 2) {
        e.preventDefault();
        iniciarPellizco(e.touches);
        return;
    }

    if (e.touches.length === 1) {
        e.preventDefault();
        iniciarArrastre(e.touches[0].clientX, e.touches[0].clientY);
    }
}

function manejarMovimientoToque(e) {
    if (!disenoVisible()) {
        return;
    }

    if (e.touches.length === 2) {
        e.preventDefault();

        if (!gesto.pellizcando) {
            iniciarPellizco(e.touches);
        }

        actualizarPellizco(e.touches);
        return;
    }

    if (e.touches.length === 1 && gesto.arrastrando && !gesto.pellizcando) {
        e.preventDefault();
        moverDiseno(e.touches[0].clientX, e.touches[0].clientY);
    }
}

function manejarFinToque(e) {
    gesto.ultimoToque = Date.now();

    if (e.touches.length >= 2) {
        return;
    }

    if (e.touches.length === 1) {
        detenerPellizco();

        if (gesto.arrastrando) {
            iniciarArrastre(e.touches[0].clientX, e.touches[0].clientY);
        }

        return;
    }

    detenerPellizco();
    detenerArrastre();
}

subirImagen.addEventListener("change", (e) => {
    const archivo = e.target.files[0];

    if (!archivo) {
        return;
    }

    const lector = new FileReader();

    lector.onload = function (event) {
        diseno.onload = function () {
            diseno.style.display = "block";
            resetearDiseno();
        };

        diseno.src = event.target.result;
    };

    lector.readAsDataURL(archivo);
});

document.querySelectorAll("[data-color]").forEach((btn) => {
    btn.addEventListener("click", () => {
        const color = btn.dataset.color;

        if (color === "blanca") {
            camisa.src = "img/camisa_blanca.png";
        }

        if (color === "negra") {
            camisa.src = "img/camisa_negra.png";
        }

        if (color === "azul") {
            camisa.src = "img/camisa_azul.png";
        }
    });
});

camisa.addEventListener("load", aplicarLayoutDiseno);

eliminarDiseno.addEventListener("click", () => {
    diseno.src = "";
    diseno.style.display = "none";
    subirImagen.value = "";
    detenerPellizco();
    detenerArrastre();
});

diseno.addEventListener("mousedown", (e) => {
    if (esEventoFantasma()) {
        return;
    }

    e.preventDefault();
    iniciarArrastre(e.clientX, e.clientY);
});

document.addEventListener("mouseup", () => {
    detenerArrastre();
});

document.addEventListener("mousemove", (e) => {
    if (!gesto.arrastrando || esEventoFantasma()) {
        return;
    }

    moverDiseno(e.clientX, e.clientY);
});

zonaDiseno.addEventListener("touchstart", manejarInicioToque, { passive: false });

document.addEventListener("touchmove", manejarMovimientoToque, { passive: false });
document.addEventListener("touchend", manejarFinToque, { passive: true });
document.addEventListener("touchcancel", manejarFinToque, { passive: true });

zonaDiseno.addEventListener("wheel", (e) => {
    e.preventDefault();
    escalarConRueda(e.deltaY);
}, { passive: false });

window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(aplicarLayoutDiseno, 100);
});

function esperarImagen(img) {
    if (img.complete && img.naturalWidth) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
    });
}

vistaPrevia.addEventListener("click", async () => {
    await esperarImagen(camisa);

    if (disenoVisible()) {
        await esperarImagen(diseno);
    }

    const containerRect = capturaArea.getBoundingClientRect();
    const camisaRect = camisa.getBoundingClientRect();
    const zonaRect = zonaDiseno.getBoundingClientRect();
    const scale = 2;

    const canvas = document.createElement("canvas");

    canvas.width = Math.round(containerRect.width * scale);
    canvas.height = Math.round(containerRect.height * scale);

    const ctx = canvas.getContext("2d");

    ctx.scale(scale, scale);

    ctx.fillStyle =
        getComputedStyle(capturaArea).backgroundColor || "#ececec";

    ctx.fillRect(0, 0, containerRect.width, containerRect.height);

    ctx.drawImage(
        camisa,
        camisaRect.left - containerRect.left,
        camisaRect.top - containerRect.top,
        camisaRect.width,
        camisaRect.height
    );

    if (disenoVisible()) {
        const disenoRect = diseno.getBoundingClientRect();

        ctx.save();

        ctx.beginPath();

        ctx.rect(
            zonaRect.left - containerRect.left,
            zonaRect.top - containerRect.top,
            zonaRect.width,
            zonaRect.height
        );

        ctx.clip();

        ctx.drawImage(
            diseno,
            disenoRect.left - containerRect.left,
            disenoRect.top - containerRect.top,
            disenoRect.width,
            disenoRect.height
        );

        ctx.restore();
    }

    ultimoCanvas = canvas;
    previewImage.src = canvas.toDataURL("image/png");
    modalPreview.style.display = "flex";
});

cerrarPreview.addEventListener("click", () => {
    modalPreview.style.display = "none";
});

descargarPNG.addEventListener("click", () => {
    if (!ultimoCanvas) {
        return;
    }

    const enlace = document.createElement("a");

    enlace.download = "mi-camisa-personalizada.png";
    enlace.href = ultimoCanvas.toDataURL("image/png");
    enlace.click();
});

aplicarLayoutDiseno();
