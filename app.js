/*
 * Module dependencies
 */
var express = require('express')
  , fs = require('fs')
  , stylus = require('stylus')
  , nib = require('nib')
  , https = require('https')
  , http = require('http')
  , cradle = require('cradle')
  , app = express()
  , options = {
	  key: fs.readFileSync('privkey.pem'),
      cert: fs.readFileSync('newcert.pem')
    }
  , server = http.createServer(app)
  , secureServer = https.createServer(options,app)
  , ioSecure = require('socket.io').listen(secureServer)
  , io = require('socket.io').listen(server)
  , db = new(cradle.Connection)().database('test')


ioSecure.configure('development', function(){
  ioSecure.set('transports', ['websocket']);
  ioSecure.set('log level', 2);
});

secureServer.listen(443)
server.listen(80)

function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}
function getViews(){
	db.view(query, function (err, docs) {
		if(!err){
			console.log(docs)
		} else {
			console.log(err)
		}
	})
}

app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(express.static(__dirname + '/public'))
app.use(stylus.middleware({ src: __dirname + '/public', compile: compile}))
app.configure('development', function(){
  app.use(express.errorHandler())
  app.locals.pretty = true
})
exports.__express = function(filename, options, callback) {
  callback(err, string);
}

app.get('/', function (req, res) {
	res.render('index')
})

handleSocket = function (socket) {

	socket.on('requestPage',function (data) {
		var query =  data.pageId+'/all'
		db.view(query, function (err, docs) {
			if(!err){
				var reponse ={}
				reponse.pageId=data.pageId
				docs.forEach(function (id,doc) {
					reponse[doc.partId]=doc.value
					reponse[doc.partId+'Id']=doc._id		
				})
				socket.emit('loadPage',reponse)
			} else {
				console.log(err)
				if(err.error=='not_found') {
					var newView = {_id:'_design/'+data.pageId,
						language:'javascript',
						views:{all:{
							map: 'function(doc) { if (doc.pageId == \''+data.pageId+'\')  emit(doc._id,doc) }'
						}}
					}
					db.save(newView,function(err, res){
						if(err) console.log(err)
					}) 
				}else socket.emit('loadPageFailed',{name:data.pageId})
			}
		})
	})


	socket.on('updateData', function (data) {
		var current_timestamp = new Date(),
		  objectToSend = {'value':data.value,'timestamp':JSON.stringify(current_timestamp),pageId:data.pageId,partId:data.partId}
		if(typeof data.id==='undefined')db.save(objectToSend,function(err, res){if(err) console.log(err)}) 
		else db.save(data.id,objectToSend,function(err, res){if(err) console.log(err)}) 
	})
}

ioSecure.sockets.on('connection', handleSocket)
io.sockets.on('connection', handleSocket)

