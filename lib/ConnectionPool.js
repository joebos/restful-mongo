var MongoClient = require('mongodb').MongoClient;

    var DATABASE = {},
    done = false


    /***
    @options - it contains or url for connection or host, port, database name for connection 
*/

function ConnectionPool() {
}

ConnectionPool.prototype.getPooledConnections = function() {
    var self = this

    var pools = [];

    var keysbyindex = Object.keys(DATABASE);
    for (var i=0; i<keysbyindex.length; i++){
        var db_url = keysbyindex[i];
        var db = DATABASE[db_url];
        var db_name = db.databaseName;
        var server = db.serverConfig.name;
        pools.push({db_url: db_url, db_name: db_name, server: server});
    }

    var result = JSON.stringify(pools, null, 2);

    return result;

}

ConnectionPool.prototype.getDb = function(db_name, username, password, cb) {
    var self = this
    var db_url = self._getConnectionUrl({ "host": "localhost", "port": "27000", "database_name": db_name, "username": username, "password": password});

    if( (typeof DATABASE[db_url]!=='undefined') && DATABASE[db_url]!=null ) {

        cb(null, DATABASE[db_url])
    } else {
        self._connect(db_url, function(err, db) {
            if(err) {
                console.log('CONNECTION POOL:ERR', err)
                cb(err, null)
            }
            DATABASE[db_url] = db
            cb(null, db);
        })
    }
}
ConnectionPool.prototype._connect = function(db_url, cb) {
    var self = this;
    var url = db_url
    console.log('DB-URL', url)
    MongoClient.connect(url, function(err, db) {
        cb(err, db)
    });
}
ConnectionPool.prototype._getConnectionUrl = function(options) {
    
    var url = (typeof options.username !== 'undefined'  ) ? ['mongodb://', options.username + ':' + options.password + '@'] : ['mongodb://']

    if (typeof options.host!=='undefined'){
        url.push(options.host+':')
    }else{
     url.push('localhost:')   
    }
    if (typeof options.port!=='undefined'){
        url.push(options.port)
    }else{
     url.push('27000')
    }

    url.push('/'+options.database_name)

    url = url.join('')
    //console.log('DB CONN URL', url)
    return url
}

module.exports=ConnectionPool