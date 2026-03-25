require('dotenv').config();
var mongoose = require('mongoose');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var { injetarUserNasViews } = require('./middlewares/authMiddleware');
var swaggerUi = require('swagger-ui-express');
var swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PAW App API',
            version: '1.0.0',
            description: 'Documentação da API da PAW App',
        },
        servers: [
            { url: 'http://localhost:3000' }
        ],
    },
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Ligado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro ao ligar ao MongoDB:', err));

var authRouter = require('./routes/auth');
var adminRouter = require('./routes/admin');
var supermercadoRouter = require('./routes/supermercado');
var clienteRouter = require('./routes/cliente');
var estafetaRouter = require('./routes/estafeta');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));

// CORS Configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(injetarUserNasViews);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
    res.redirect('/auth/registar');
});

app.use('/auth', authRouter);
app.use('/admin', adminRouter);
app.use('/supermercado', supermercadoRouter);
app.use('/cliente', clienteRouter);
app.use('/estafeta', estafetaRouter);

app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
