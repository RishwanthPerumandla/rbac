const router = require('express').Router()

router.get('/profile',(req,res,next)=>{
    console.log(req.user)
    res.send('USER PROFILE')
})


module.exports = router