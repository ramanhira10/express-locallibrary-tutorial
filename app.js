var express = require('express');
var path = require('path');
var compression = require('compression');
var helmet = require('helmet');
var mongoose = require('mongoose');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');

var app = express();


var mongoDB = 'mongodb+srv://dbUser:dbUserPassword@cluster0.zhkee.mongodb.net/local_library?retryWrites=true&w=majority';

mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(helmet());
app.use(compression());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view enging', 'pug');
//app.set('port', 3000);

module.exports = app;
