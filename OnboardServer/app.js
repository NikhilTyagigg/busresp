var express = require('express');
var path = require('path');
const cors = require("cors");
var dotenv = require('dotenv')
const logger = require('./helper/logger')
var mLogger = require('morgan');
const mqtt = require('./helper/mqtt')
dotenv.config()
var swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');


var app = express('');

logger.stream = {
  write: function(message, encoding){
      logger.info(message);
  }
};
app.use(mLogger('combined', { stream: logger.stream }));



app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({  
  limit: '50mb',
  extended: true,
  parameterLimit : 50000
}));

const apiV1Router = require('./routes/api/v1');

app.use(express.static(path.join(__dirname, '/build')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.use('/api/v1', apiV1Router);

app.get('/', function(req, res, next) {
    //return res.sendFile(__dirname, 'build','index.html');
        return res.sendFile(path.join(__dirname, 'build/index.html'));
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


app.get('/*', function(req, res, next) {
  return res.sendFile(__dirname + '/build/index.html');
})

mqtt.connectToMqtt()
module.exports = app;
