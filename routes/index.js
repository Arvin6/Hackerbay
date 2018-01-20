var express = require('express');
var router = express.Router();
var path = require('path');
var jwt = require('jsonwebtoken');
var jpatch = require('jsonpatch');
var jimp = require('jimp');
var secret = require('../config.js')['secret']
var winston = require('winston')

winston.configure({
  transports: [
    new (winston.transports.Console)({name: 'debug-console',
    level: 'debug',
    prettyPrint: true,
    handleExceptions: true,
    json: false,
    colorize: true}),
    new (winston.transports.File)({ filename: 'hackerbay.log' })
  ]
});

var result_object = { 
  // This is a response object for sending after request
  status: 200,
  data : null,
  success : true,
  message : null
}

function authenticate(req, res, next){
  // Authentication function for checking jwt
  token = req.headers.authorization
  jwt.verify(token, secret, function(err, payload){
    if (err){
      winston.error(err)
      return res.send('Authentication Error', 401)
    }
    return next()
  })
}

router.get('/', function(req, res){
  // Redirects / to login
  res.redirect('/login')
})

router.get('/image_thumbnail', authenticate, function(req,res){
  // Thumbnail generation endpoint
  let result = result_object
  try{
  if(!req.query.image_url){
    throw 'image_url field is required.'
  }
  let image_url = req.query.image_url
  jimp.read(image_url, function(err, image){
    if (err){
      throw "Can't read image"
    }
    image.resize(50,50)
    image.write(img_loc, function(err, result){
      if (err){
        throw "Can't write image"
      }
      res.set({'content-type':'image/png'})
      return res.sendFile(img_loc)    
    })
  })
  // taking advantage of Async
  let img_loc = path.join(__dirname, '../public/images/temp', Date.now()+'.png')
}
catch(err){
  winston.info(err)
  res.set({'content-type':'application/json'})
  res.status(400)
  result['data'] = null
  result['message'] = err
  result['success'] = false
  result['status']  = 400
  return res.send(result)
}
})

router.post('/json_patch', authenticate, function(req, res){
  // Json patching endpoint
  let result = result_object
  json_object = req.body.json_object
  json_patch_object = req.body.json_patch_object
  res.set({'content-type':'application/json'})
  try{
  patched_object = jpatch.apply_patch(json_object, json_patch_object)
  result['data'] = patched_object
  result['message'] = null
  result['success'] = true
  result['status'] = 200
  res.status(200)
  }
  catch(err){
    winston.info(err)
    result['data'] = null
    result['success'] = false
    result['message'] = err.message
    result['status'] = 400
    res.status(400)
  }
  return res.send(result)
})

router.get('/login', function(req, res) {
  // Serves our login page
  res.render('login');
})

router.post('/login', function(req, res){
  // Sends JWT in header on success
  let result = result_object
  try{
  let now = Math.floor(Date.now()/1000) 
  let exp = now + (60*60*12) // 12 hrs
  let nameRegex = new RegExp('^[A-Za-z0-9]+$')
  if (req.body === {} || nameRegex.test(req.body.username) === false || req.body.password === ''){
    throw 'Invalid input'
  }
  let payload = {
    "iat" : now,
    "exp" : exp,
    "user": req.body.username
  }
  token = jwt.sign(payload, secret, {"algorithm": "HS256"})
  res.set({'access_token':token})
  res.render('index',{title:'HackerBay'})
}
catch(err){
  winston.info(err)
  result['data'] = null
  result['success'] = false
  result['message'] = err
  result['status'] = 400
  res.status(401)
  res.send(result)
}
})

module.exports = router;
