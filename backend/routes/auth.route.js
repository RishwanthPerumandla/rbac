const router = require('express').Router()
const User = require('../models/user.model')
const {body, validationResult } = require('express-validator')
const passport = require('passport')
const { ensureLoggedOut, ensureLoggedIn } = require('connect-ensure-login');
const {registerValidator} = require('../utils/validators')


router.get('/login',  ensureLoggedOut({ redirectTo: '/' }) ,async (req,res,next)=>{
    res.send('Login')
})

router.post('/login',  ensureLoggedOut({ redirectTo: '/' }), passport.authenticate('local',{
    //  successRedirect:"/",
     successReturnToOrRedirect:'/',
     failureRedirect:"/auth/login",
     failureFlash:true
}))

router.get('/register',   ensureLoggedOut({ redirectTo: '/' }),async (req,res,next)=>{
    // req.flash('error', "Some Error")
    // req.flash('key', 'some value')
    // const messages = req.flash()
    // console.log(messages)
    res.send('register')
})

router.post('/register', ensureLoggedOut({ redirectTo: '/' }),registerValidator, async (req,res,next)=>{
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()){
            errors.array().forEach(error=>{
                req.flash('error', error.msg)
            })
            console.log(errors)
            res.send({email: req.body.email, messages:req.flash() })
            return;
        }
        const { email } = req.body;
        const doesExist = await User.findOne({ email })
        // console.log(doesExist)/
        if(doesExist){
            req.flash('warning', 'Username/email already exists');
            res.redirect('/auth/register')
            return;
        }
        const user = new User(req.body)
        await user.save();
        req.flash('success', `${user.email} registered successfully, you can login`)
        res.redirect('/auth/login')
    } catch (error) {
        next(error)
    }
   
})

router.get('/logout', ensureLoggedIn({ redirectTo: '/' }),async (req,res,next)=>{
    req.logOut();
    res.redirect('/');
})


// function ensureAuthenticated(req,res, next){
//     if(req.isAuthenticated()){
//       next()
//     } else{
//       res.redirect('/auth/login')
//     }
//   }


// function ensureNotAuthenticated(req,res, next){
//     if(req.isAuthenticated()){
//         res.redirect('back')
//     } else{
//       next()
//     }
//   }


  
module.exports = router