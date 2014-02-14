
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , config=require('./config.js');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 6032);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);


/***
  Configure app the handle REST HTTP methods
***/

var RestfulMongo=require('restful-mongo')
restfulMongo = new RestfulMongo({
                        url: 'mongodb://localhost:27017/restdb'
}) 

restfulMongo.configure(app, config );

/*var TwitterSearch = require('./lib/twittersearch.js')
var twitter = new TwitterSearch()
twitter.setTWSearchGet(app);*/


var exec = require('child_process').exec;

function setTwitterSearchGet (app) {
    var self=this
    /**
     * Query
     */
    console.log('TwitterSearch', 'Configuring GET')

    app.get('/api/twittersearch/?', function(req, res) {

        var keyword = req.query.keyword

        var userid = req.query.username
        var leadcat = req.query.leadcat


        var execStr = 'phantomjs /home/ec2-user/social/charlesbank/leads/get-tweeters.js "' +  userid + '" 1 "' + keyword + '" 1 1 1 1';

        console.log(execStr);

        child = exec(execStr, function callback(error, stdout, stderr) {

            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
                res.json(500, {"result": "failure", "error": error } );
            }

            res.json(200, {"result": "success"});
            /*var output = stdout.trim();

             // In my casperJS script I echo "TIME OUT" if my casper js tests timed out due to connectivity issues, bad performance, etc.

             if (output.indexOf("TIME OUT") === -1) {

             // NO TIME OUT so casperjs returned results and lets process them!

             var results = JSON.parse(output);

             // Results now contains an expected JSON KVO, array, etc.

             // Process results using normal nodejs packages/libraries
             }*/
        });

    });
}

setTwitterSearchGet(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
