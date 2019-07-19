require('dotenv').config();

var express = require('express');
var app = express();
var port = process.env.PORT || 3000;
var morgan = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var path = require('path');

var router = express.Router();
var appRoutes = require('./app/routes/api')(router);

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));
app.use('/api', appRoutes);

mongoose.connect(process.env.URI, {
    useNewUrlParser: true
  },
  function(err) {
    if (err) {
      console.log('\nFAILURE: UNABLE TO CONNECT TO THE DATABASE:\n' + err);
    } else {
      console.log('\nSUCCESS: CONNECTED TO THE DATABASE\n');
    }
  });

app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname + '/public/app/views/index.html'));
});

app.listen(port, function() {
  console.log('\nSERVER RUNNING ON PORT: ' + port + '\n');
});
