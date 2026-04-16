const mongoose = require('mongoose');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./config/config');
const { injetarUserNasViews } = require('./middlewares/authMiddleware');

const app = express();

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
    apis: ['./routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);

mongoose.connect(config.MONGODB_URI)
    .then(() => {
        console.log('Ligado ao MongoDB!');
        require('./services/authService').inicializarAdmin();
    })
    .catch(err => console.error('Erro MongoDB:', err));

// Configurações do Express e EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(injetarUserNasViews);

// Rota da Documentação
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas principais
app.get('/', (req, res) => res.redirect('/auth/login'));

app.use('/auth', require('./routes/auth'));
app.use('/admin', require('./routes/admin'));
app.use('/supermercado', require('./routes/supermercado'));
app.use('/cliente', require('./routes/cliente'));
app.use('/estafeta', require('./routes/estafeta'));

// Tratamento de erros
app.use((req, res, next) => next(createError(404)));

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.tituloErro = err.tituloErro; // Passa o título customizado se existir
    res.locals.detalheErro = err.detalheErro; // Passa o detalhe customizado se existir
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
module.exports = app;
