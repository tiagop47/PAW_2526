const multer = require('multer');
const path = require('path');

var uploadConfig = {};

/**
 * Configuração do armazenamento em disco.
 */
uploadConfig.storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'images', 'produtos'));
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

/**
 * Filtro de tipos de ficheiro permitidos.
 */
uploadConfig.fileFilter = function (req, file, cb) {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowed.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de imagem não suportado.'), false);
    }
};

/**
 * Instância final do Multer configurada.
 * Nota: Exportamos a instância diretamente para ser usada como middleware nas rotas.
 */
const upload = multer({ 
    storage: uploadConfig.storage, 
    fileFilter: uploadConfig.fileFilter, 
    limits: { fileSize: 5 * 1024 * 1024 } 
});

module.exports = upload;
