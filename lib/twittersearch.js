
var exec = require('child_process').exec;

function TwitterSearch(){
}


TwitterSearch.prototype.setTwitterSearchGet = function(app) {
    var self=this
    /**
     * Query
     */
    console.log('TwitterSearch', 'Configuring GET')

    app.get('/api/twitter-search/?', function(req, res) {

        var keyword = req.query.keyword

        var userid = req.query.userid
        var leadcat = req.query.leadcat


        var execStr = "phantomjs /home/white/GitHub/charlesbank/leads/get-tweeters.js " +  userid + " 1 " + keyword + " 1 1 1 1";

        console.log(execStr);

        child = exec(execStr, function callback(error, stdout, stderr) {

            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }

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

module.exports=TwitterSearch