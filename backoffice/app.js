const mongoose = require('mongoose');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config/config');
const { injetarUserNasViews } = require('./middlewares/authMiddleware');

const app = express();

app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

app.use(morgan('dev'));

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PAW App API',
            version: '1.0.0',
            description: 'Documentação da API do projeto PAW',
        },
        servers: [{ url: 'http://localhost:3000' }],
    },
    apis: ['./routes/*.js', './routes/api/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

mongoose.connect(config.MONGODB_URI)
    .then(() => console.log('Ligado ao MongoDB!'))
    .catch(err => console.error('Erro MongoDB:', err));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'public', 'images', 'produtos')));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de autenticação global para as Views
app.use(injetarUserNasViews);

// 1. Rota da Documentação
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 2. Rotas do Backoffice (EJS / BackOffice)
app.use('/', require('./routes/backofficeIndex'));

// 3. Rotas da API (Angular / Frontoffice)
app.use('/api', require('./routes/api/index'));

app.use((req, res, next) => next(createError(404)));

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.tituloErro = err.tituloErro;
    res.locals.detalheErro = err.detalheErro;
    res.status(err.status || 500);

    if (req.originalUrl.startsWith('/api')) {
        return res.json({ error: err.message });
    }
    res.render('error');
});

module.exports = app;
