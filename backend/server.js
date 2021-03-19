const express = require('express');
const morgan = require('morgan')
const createHttpError = require('http-errors')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()
const session = require('express-session')
const connectFlash = require('connect-flash')
const passport = require('passport')
const MongoStore = require('connect-mongo').default;
const connectEnsure = require('connect-ensure-login');
const { roles } = require('./utils/Constants');

const app = express()
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({extended: false}))

//Init Session
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized : false,
  cookie:{
    // secure:true
    httpOnly: true
  },
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}))

//for passportjs authentication
app.use(passport.initialize());
app.use(passport.session())
require('./utils/passport.auth')

app.use((req,res,next)=>{
  res.locals.user = req.user
  next()
})


//Flash Messages
app.use(connectFlash())
app.use((req,res,next)=>{
  res.locals.messages = req.flash()
  next()
})

//Routes
app.use('/', require('./routes/index.route') )
app.use('/auth', require('./routes/auth.route'))
app.use('/user',connectEnsure.ensureLoggedIn({redirectTo: '/auth/login'}), require('./routes/user.route'))
app.use('/admin',connectEnsure.ensureLoggedIn({redirectTo: '/auth/login'}),ensureAdmin,require('./routes/admin.route'))

app.use((req,res,next)=>{
  next(createHttpError.NotFound())
})

app.use((error,req,res,next)=>{
  error.status = error.status || 500
  res.status(error.status)
  res.send(error)
})

const PORT = process.env.PORT || 5000

mongoose.connect(process.env.MONGO_URI,{
  dbName: process.env.DB_NAME,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
})
.then(()=>{
  console.log('connected to DB...');
  app.listen(
    PORT,
    console.log(
      `Server Running  on Port ${PORT}`,
    ),
  )
  
})


// function ensureAuthenticated(req,res, next){
//   if(req.isAuthenticated()){
//     next()
//   } else{
//     res.redirect('/auth/login')
//   }
// }


function ensureAdmin(req,res,next){
  if(req.user.role === roles.admin){
    next()
  }else{
    req.flash('warning', 'you are not authorised to see this route')
    res.redirect('/')
  }
}

function ensureModerator(req,res,next){
  if(req.user.role === roles.moderator){
    next()
  }else{
    req.flash('warning', 'you are not authorised to see this route')
    res.redirect('/')
  }
}