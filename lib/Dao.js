var mongo = require("mongodb"),
    util = require("./util.js"),
    BSON = mongo.BSONPure,
    ConnectionPool=require('./ConnectionPool.js'),
    T = this;

/*function Dao(options) {
    this.connectionPool = options.connectionPool
}*/

function Dao() {
    var self = this;
    var connectionPool=new ConnectionPool()
    self.connectionPool = connectionPool
}


Dao.prototype.query = function(dbName, collectionName, query, fields, options, cb) {
    var T = this
    console.log(dbName, collectionName, query, fields, options);

    T.connectionPool.getDb(dbName, this.options.db.username,  this.options.db.password, function(err, db) {
        if(!err) {
            db.collection(collectionName, function(err, collection) {
                console.log('query, fields, options', collectionName, query, fields, options)

                if(typeof options.hint !== 'undefined') {
                    collection.ensureIndex(options.hint, {
                        background: true
                    }, function(err, res) {
                        if(err) {
                            return cb(err)
                        }
                        T._doQuery(collection, query, fields, options, cb)
                    })
                } else {
                    T._doQuery(collection, query, fields, options, cb)
                }

            })
        }

    })
}


Dao.prototype._doQueryAsCursor = function(coll, query, fields, options, cb) {
    coll.find(query, fields, options, function(err, cursor) {
        done(err, cursor, cb)
    });
}
Dao.prototype._doQuery = function(coll, query, fields, options, cb) {
    coll.find(query, fields, options, function(err, cursor) {
        cursor.toArray(function(err, docs) {
            done(err, docs, cb)
        })
    });
}
Dao.prototype.queryAsCursor = function(dbName, collectionName, query, fields, options, cb) {
    var T = this
    console.log('db.collName,query, fields, options', dbName, collectionName, query, fields, options);

    T.connectionPool.getDb(dbName, this.options.db.username,  this.options.db.password, function(err, db) {
        if(err) {
            return done(err)
        }

        db.collection(collectionName, function(err, collection) {
            console.log('query, fields, options', collectionName, query, fields, options)

            if(typeof options.hint !== 'undefined') {
                collection.ensureIndex(options.hint, {
                    background: true
                }, function(err, res) {
                    if(err) {
                        return cb(err)
                    }
                    T._doQueryAsCursor(collection, query, fields, options, cb)
                })
            } else {
                T._doQueryAsCursor(collection, query, fields, options, cb)
            }

        })

    })
}

Dao.prototype.get = function(dbName, collectionName, query, fields, options, cb) {
    var T = this
    T.connectionPool.getDb(dbName, this.options.db.username,  this.options.db.password, function(err, db) {
        if(!err) {
            db.collection(collectionName, function(err, collection) {
                console.log('query, fields, options', query, fields, options)
                collection.find(query, fields, options, function(err, cursor) {
                    cursor.toArray(function(err, docs) {
                        if(docs) {
                            docs = docs[0]
                        }
                        //         db.close();
                        done(err, docs, cb)
                    });
                });
            });
        }

    })
}

Dao.prototype.save = function(dbName, collectionName, body, cb) {
    var T = this
    console.log('dbName', dbName)
    T.connectionPool.getDb(dbName, this.options.db.username,  this.options.db.password, function(err, db) {
        if(!err) {
            db.collection(collectionName, function(err, collection) {
                // We only suc.pport inserting one document at a time
/*                collection.insert(Array.isArray(body) ? body[0] : body, function(err, docs) {
                    if(Array.isArray(docs)) {
                        docs = docs[0]
                    }
                    //  db.close();
                    cb(err, docs)
                });
*/              var docs=body;
                collection.insert(docs, function(err, docs) {
                    cb(err, docs)
                });

            });
        }

    })
}


Dao.prototype.upsert = function(dbName, collectionName, body, cb) {
    var T = this
    console.log('dbName', dbName)
    T.connectionPool.getDb(dbName, this.options.db.username,  this.options.db.password, function(err, db) {
        if(!err) {
            db.collection(collectionName, function(err, collection) {

                //var keyforhide=Array.isArray(body.hiddenkeys) ? body.hiddenkeys : [body.hiddenkeys];
                //var keyforduplicate=Array.isArray(body.duplicatekeys) ? body.duplicatekeys : [body.duplicatekeys];
                var docs = Array.isArray(body.docs) ? body.docs : [body.docs];
                var hide_key = body.hide_key;
                var dup_key=body.dup_key;

                var hide_query='';
                var dup_query='';
                var hide_values=[];
                var dup_values=[];

                for(var i=0; i<docs.length; i++){
                    var hide_key_value=docs[i][hide_key];
                    var dup_key_value=docs[i][dup_key];
                    hide_values.push(hide_key_value);
                    dup_values.push(dup_key_value);
                }

//                hide_query = hide_key + ': { $in: [ ' + hide_values.join(',') + ' ]}';
//                dup_query = dup_key + ': { $in: [ ' + dup_values.join(',') + ' ]}';

                var hide_query = {};
                hide_query[hide_key]= { $in: hide_values};
                var dup_query = {};
                dup_query[dup_key] = { $in: dup_values };
                var hide_update = {$set: {filter: 'sameperson'}};
                var dup_update = {$set: {filter: 'samepost'}};

                collection.update(hide_query, hide_update, {upsert:false, multi:true, safe:true}, function(err, doc) {
                    collection.update(dup_query, dup_update, {upsert:false, multi:true, safe:true}, function(err, doc) {
                        collection.insert(docs, function(err, docs) {
                            cb(err, docs)
                        });
                    });
                });



            });
        }

    })
}


Dao.prototype.update = function(dbName, collectionName, query, newObj, options, cb) {
    var T = this

    //newObj.

    T.connectionPool.getDb(dbName, this.options.db.username,  this.options.db.password, function(err, db) {
        if(!err) {
            db.collection(collectionName, function(err, collection) {

                delete newObj._id
                collection.findAndModify(query, [], newObj, options, function(err, doc) {
                    // db.close();
                    done(err, doc, cb)
                });


            });
        }

    })

}



Dao.prototype.count = function(dbName, collectionName, query, options, cb) {

    var T = this

    T.connectionPool.getDb(dbName, this.options.db.username,  this.options.db.password, function(err, db) {
        if(!err) {
            db.collection(collectionName, function(err, collection) {

                collection.find(query, options).count(function(err, count) {
                    // db.close();
                    done(err, count, cb)
                });


            });
        }

    })


}

Dao.prototype.remove = function(dbName, collectionName, query, options, cb) {
    var T = this

    T.connectionPool.getDb(dbName, this.options.db.username,  this.options.db.password, function(err, db) {
        if(!err) {
            db.collection(collectionName, function(err, collection) {

                collection.remove(query, {single:false},function(err, numberOfRemoved) {
                    if(err) {
                        return done(err, null, cb)
                    }
                    console.log('DAO: number of removed is', numberOfRemoved);
                    return done(err, numberOfRemoved, cb)
                })

            });
        }

    })
}


function done(err, res, cb) {
    if(err) {
        cb(err, null)
    } else {
        cb(null, res)
    }
}


module.exports = Dao