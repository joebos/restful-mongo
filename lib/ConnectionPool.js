var MongoClient = require('mongodb').MongoClient;

    var DATABASE = {},
    done = false


    /***
    @options - it contains or url for connection or host, port, database name for connection 
*/

function ConnectionPool() {
}

ConnectionPool.prototype.getDb = function(db_name, username, password, cb) {
    var self = this
    db_url = self._getConnectionUrl({ "host": "localhost", "port": "27017", "database_name": db_name, "username": username, "password": password});

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
    var self = this,
        url = db_url
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
     url.push('27017')   
    }

    url.push('/'+options.database_name)

    url = url.join('')
    //console.log('DB CONN URL', url)
    return url
}

module.exports=ConnectionPool