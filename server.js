const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir carpetas de recursos apuntando correctamente a la subcarpeta
app.use('/css', express.static(path.join(__dirname, 'camisas-ai', 'css')));
app.use('/img', express.static(path.join(__dirname, 'camisas-ai', 'img')));
app.use('/js', express.static(path.join(__dirname, 'camisas-ai', 'js')));
app.use('/pages', express.static(path.join(__dirname, 'camisas-ai', 'pages')));

// Servir el index.html principal dentro de camisas-ai
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'camisas-ai', 'index.html'));
});

// Filtro definitivo para redirecciones internas
app.get(/^(?!\/(css|img|js|pages)).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'camisas-ai', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});