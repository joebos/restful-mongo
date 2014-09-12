/*
rest.js
mongodb-rest

Created by Tom de Grunt on 2010-10-03.
Copyright (c) 2010 Tom de Grunt.
This file is part of mongodb-rest.
*/
var mongo = require("mongodb"),
    util = require("./util.js"),
    BSON = mongo.BSONPure,
    DaoModule = require('./Dao.js');


// TODO: instead of only one database, based on url, put the possibility to open more connection to different database
//       it requires that module ConnecitonPool instead of only 1 database sotres an object with url2database
//       so if the url is new, then it can create a nre connection, the only problem is that when dao make a query it is 
//       to be able to detect on which database the query is to 
//       be performed, 
//      
//  TODO: in configure, you have to pass app to different methods
//  TODO: transform setGet etc. in ._setGet


function RestfulMongo(){
    var self=this;

    self.Dao= new DaoModule();
}


RestfulMongo.prototype.getDao=function(){
    var self=this
    return self.Dao
}

RestfulMongo.prototype.configure=function(app, options){
    

    /****************/
    var options = options || {}
    , self=this

    if(options.methods) {
        var methods = options.methods
        methods = methods.map(function(m) {
            return m.toLowerCase()
        })

        methods.indexOf('get') >= 0 && self._setGet(app)
        methods.indexOf('get') >= 0 && self._setGetCount(app)
        methods.indexOf('post') >= 0 && self._setPost(app)
        methods.indexOf('put') >= 0 && self._setPut(app)
        methods.indexOf('del') >= 0 && self._setDel(app)

        methods.indexOf('post') >= 0 && self._setPost2(app)


    } else {
        self._setGet(app)
        self._setGetCount(app)
        self._setPost(app)
        self._setPut(app)
        self._setDel(app)

        self._setPost2(app)
    }

    self.get_filter = options.get_filter ? options.get_filter: {}

    self.Dao.options = options;
}


RestfulMongo.prototype._setGet=_setGet
RestfulMongo.prototype._setGetCount=_setGetCount
RestfulMongo.prototype._setDel=_setDel
RestfulMongo.prototype._setPut=_setPut
RestfulMongo.prototype._setPost2=_setPost2
RestfulMongo.prototype._setPost=_setPost

function _setGetCount(app) {
    var self=this
    /**
     * Query
     */
    console.log('RESTful Mongo', 'Configuring GET count')

    app.get('/api-count/:db/:collection/:id?', function(req, res) {
        var extend = require('util')._extend;

        console.log(req.query.query);

        var query = req.query.query ? JSON.parse(req.query.query.replace(/'/g, '"')) : extend({},self.get_filter);
        console.log(query);

        // Providing an id overwrites giving a query in the URL
        if(req.params.id) {
            var id=req.params.id;
            if (id.match(/^[0-9a-fA-F]{24}$/)){
                id=new BSON.ObjectID(id);
            }
            query = {
                '_id': id,
                'followed': {$ne: 'True'}
            };
        }
        var options = req.params.options || {};
        var fields = {}
        var test = ['limit', 'sort', 'skip', 'hint', 'explain', 'snapshot', 'timeout', '$exist'];


        for(o in req.query) {
            if (o=='query')
                continue;
            if(test.indexOf(o) >= 0) {
                if(o == 'fields') {
                    req.query[o].split(/,/g).forEach(function(fName) {
                        fields[fName] = 1
                    })
                } else if(o == 'sort') {
                    var sort = {}
                    req.query[o].split(/,/g).forEach(function(el) {
                        if(el.match(/^-/g)) {
                            var fieldName = el.substring(1, el.length)
                            sort[fieldName] = -1
                        } else {
                            sort[el] = 1
                        }
                    })
                    options['sort'] = sort
                } /************* code inserted  */
                else if(o == '$exist') {
                    var fs = req.query[o].split(/,/g)
                    fs.forEach(function(f) {
                        query[f] = {
                            $exists: 1
                        }
                    })
                } /* ********* */
                else {

                    options[o] = req.query[o];
                }
            } else {
                if(o == 'or') {
                    var val = req.query[o].substring(1, req.query[o].length - 1),
                        or = []
                    val.split(/,/g).forEach(function(el) {
                        var dict = el.split(/=/g)
                        var obj = {}
                        if(dict[0] == '_id') {
                            dict[1] = new BSON.ObjectID(dict[1])
                        }
                        obj[dict[0].toString()] = dict[1]
                        or.push(obj)
                    })
                    query['$or'] = or
                } else if(o == '$regex') {
                    var field = req.query[o].match(/[^,]*/)[0],
                        regex = req.query[o].match(/,.*/)[0].substring(1)
                    query[field] = {
                        '$regex': new RegExp(regex)
                    }
                    console.log('$regex', field, regex)
                } else {
                    query[o] = req.query[o];
                }

            }
        }
        console.log(query)

        if(req.params.id) {
            self.Dao.count(req.params.db, req.params.collection, query, options, function(err, count) {
                if(!err && !doc) {
                    res.send(404)
                } else if(err) {
                    res.json(500, err)
                } else {
                    res.json(200, doc)
                }
            })
        } else {
            self.Dao.count(req.params.db, req.params.collection, query, options, function(err, count) {
                if(err) {
                    res.json(500, err)
                } else {
                    res.json(200, {'count': count})
                }
            })
        }
    });
}

function _setGet(app) {
    var self=this
    /**
     * Query
     */
    console.log('RESTful Mongo', 'Configuring GET')

    app.get('/api/:db/:collection/:id?', function(req, res) {
        var extend = require('util')._extend;
        //var query_value_string = req.query.query.replace(/'/g, '"');

        //console.log(query_value_string);

        var query = req.query.query ? JSON.parse(req.query.query.replace(/'/g, '"')) : extend({},self.get_filter);
        console.log(query)

        // Providing an id overwrites giving a query in the URL
        if(req.params.id) {
            var id=req.params.id;
            if (id.match(/^[0-9a-fA-F]{24}$/)){
                id=new BSON.ObjectID(id);
            }
            query = {
                '_id': id
            };
        }
        var options = req.params.options || {};
        var fields = {}
        var test = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout', '$exist'];


        for(o in req.query) {
            if (o=='query')
                continue;
            if(test.indexOf(o) >= 0) {
                if(o == 'fields') {
                    req.query[o].split(/,/g).forEach(function(fName) {
                        fields[fName] = 1
                    })
                } else if(o == 'sort') {
                    var sort = {}
                    req.query[o].split(/,/g).forEach(function(el) {
                        if(el.match(/^-/g)) {
                            var fieldName = el.substring(1, el.length)
                            sort[fieldName] = -1
                        } else {
                            sort[el] = 1
                        }
                    })
                    options['sort'] = sort
                } /************* code inserted  */
                else if(o == '$exist') {
                    var fs = req.query[o].split(/,/g)
                    fs.forEach(function(f) {
                        query[f] = {
                            $exists: 1
                        }
                    })
                } /* ********* */
                else {

                    options[o] = req.query[o];
                }
            } else {
                if(o == 'or') {
                    var val = req.query[o].substring(1, req.query[o].length - 1),
                        or = []
                        val.split(/,/g).forEach(function(el) {
                            var dict = el.split(/=/g)
                            var obj = {}
                            if(dict[0] == '_id') {
                                dict[1] = new BSON.ObjectID(dict[1])
                            }
                            obj[dict[0].toString()] = dict[1]
                            or.push(obj)
                        })
                        query['$or'] = or
                } else if(o == '$regex') {
                    var field = req.query[o].match(/[^,]*/)[0],
                        regex = req.query[o].match(/,.*/)[0].substring(1)
                        query[field] = {
                            '$regex': new RegExp(regex)
                        }
                    console.log('$regex', field, regex)
                } else {
                    query[o] = req.query[o];
                }

            }
        }

        console.log(query)

        if(req.params.id) {
            self.Dao.get(req.params.db, req.params.collection, query, fields, options, function(err, doc) {
                if(!err && !doc) {
                    res.send(404)
                } else if(err) {
                    res.json(500, err)
                } else {
                    res.json(200, doc)
                }
            })
        } else {
            self.Dao.query(req.params.db, req.params.collection, query, fields, options, function(err, docs) {
                if(err) {
                    res.json(500, err)
                } else {
                    res.json(200, docs)
                }
            })
        }
    });
}

function _setPost(app) {
    var self=this
    console.log('RESTful Mongo', 'Configuring POST')
    /**
     * Insert
     */
    app.post('/api-insert/:db/:collection', function(req, res) {

        if (req.body.created_time==null){
            req.body.created_time = Date.now();
        }
        if (req.body.updated_time==null){
            req.body.updated_time = Date.now();
        }

        console.log(req.body);

        self.Dao.save(req.params.db, req.params.collection, req.body, function(err, doc) {
            if(err) {
                return res.json(500, err)
            }
            res.json(200, doc)
        })
    });
}


function _setPost2(app) {
    var self=this
    console.log('RESTful Mongo', 'Configuring POST')
    /**
     * Insert
     */
    app.post('/api/:db/:collection', function(req, res) {
        self.Dao.upsert(req.params.db, req.params.collection, req.body, function(err, doc) {
            if(err) {
                return res.json(500, err)
            }
            res.json(200, doc)
        })
    });
}

function _setPut(app) {
    var self=this
    console.log('RESTful Mongo', 'Configuring PUT')

    /**
     * Update
     */
    app.put('/api/:db/:collection/:id?', function(req, res) {

        try{
            var dbName = req.params.db;

            var spec_id={};
            if(req.params.id) {
                var id=req.params.id;
                if (id.match(/^[0-9a-fA-F]{24}$/)){
                    id=new BSON.ObjectID(id);
                }
                spec_id = {
                    '_id': id
                };
            }
            var query = req.query.query ? JSON.parse(req.query.query.replace(/'/g, '"')) : spec_id;

            if (req.body['$set'].updated_time==null){
                req.body['$set'].updated_time = Date.now();
            }

            //if (Object.keys(query).length === 0){
            //    res.json(500, "either id or query is required!");
            //}
            //else{
                self.Dao.connectionPool.getDb(dbName, function(err, db) {
                    if(!err) {
                        db.collection(req.params.collection, function(err, collection) {
                            delete req.body._id
                            console.log(req.body)
                            if(!req.params.id){
                                collection.update(query, req.body, {
                                    multi: true,
                                    upsert: true
                                }, function(err, doc) {
                                    if(err) {
                                        res.json(500, err)
                                    } else {
                                        res.json(200, {"num_of_docs": doc})
                                    }
                                });
                            }
                            else{
                                collection.findAndModify(query, [], req.body, {
                                    new: true,
                                    upsert: true,
                                    w: 1,
                                    j: true
                                }, function(err, doc) {
                                    if(err) {
                                        res.json(500, err)
                                    } else {
                                        res.json(200, doc)
                                    }
                                });
                            }
                        });
                    }
                })
            //}
        }
        catch(err){
            res.json(500, err)
        }
    });
}

function _setPutOLD(app) {
    var self=this
    console.log('RESTful Mongo', 'Configuring PUT')

    /**
     * Update
     */
    app.put('/api/:db/:collection/:id?', function(req, res) {

        try{
            var dbName = req.params.db;

            var spec_id={};
            if(req.params.id) {
                var id=req.params.id;
                if (id.match(/^[0-9a-fA-F]{24}$/)){
                    id=new BSON.ObjectID(id);
                }
                spec_id = {
                    '_id': id
                };
            }
            var query = req.query.query ? JSON.parse(req.query.query.replace(/'/g, '"')) : spec_id;

            if (req.body['$set'].updated_time==null){
                req.body['$set'].updated_time = Date.now();
            }

            //if (Object.keys(query).length === 0){
            //    res.json(500, "either id or query is required!");
            //}
            //else{
            self.Dao.connectionPool.getDb(dbName, function(err, db) {
                if(!err) {
                    db.collection(req.params.collection, function(err, collection) {
                        delete req.body._id
                        console.log(req.body)
                        collection.findAndModify(query, [], req.body, {
                            new: true,
                            upsert: true, w:1, j: true
                        }, function(err, doc) {
                            if(err) {
                                res.json(500, err)
                            } else {
                                res.json(200, doc)
                            }
                        });
                    });
                }
            })
            //}
        }
        catch(err){
            res.json(500, err)
        }
    });
}

function _setDel(app) {
    var self=this
    console.log('RESTful Mongo', 'Configuring DEL')

    /**
     * Delete
     */
    app.del('/api/:db/:collection/:id', function(req, res) {

        var dbName = req.params.db;

        var spec = {
            '_id': new BSON.ObjectID(req.params.id)
        };

        self.Dao.connectionPool.getDb(dbName, function(err, db) {
            if(!err) {
                db.collection(req.params.collection, function(err, collection) {
                    collection.remove(spec, function(err, docs) {
                        res.header('Content-Type', 'application/json');
                        res.send('{"ok":1}');
                    });
                });
            }
        })

    });
}

module.exports=RestfulMongo
