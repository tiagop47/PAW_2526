require('dotenv').config();
var mongoose = require('mongoose');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Ligado ao MongoDB com sucesso!'))
    .catch(err => console.error('Erro ao ligar ao MongoDB:', err));

var authRouter = require('./routes/auth');
var usersRouter = require('./routes/users');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.redirect('/auth/registar');
});

app.use('/auth', authRouter);
app.use('/users', usersRouter);

app.use(function (req, res,next) {
    next(createError(404));
});

app.use(function (err, req, res) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
