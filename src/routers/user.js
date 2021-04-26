const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user.js');
const auth = require('../middleware/auth.js')
const { sendWelcomeEmail, sendSignoffEmail } = require('../emails/account.js')
const router = new express.Router();


//Operations on Users Collection
//Write operation
//User creation
router.post('/users', async (req, res)=>{
    const user = new User(req.body);

    try{
        await user.save();
        sendWelcomeEmail(user.email, user.name, req.body.password)
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    }catch(e){
        res.status(400).send(e);
    }
})

//Login Operation
router.post('/users/login', async(req, res)=>{
    try{
        const user = await User.findByCredentials( req.body.email, req.body.password);
        //Here we are using 'user', instead of 'User' because, Jwson Web Token work on individual user not as a whole.
        const token = await user.generateAuthToken();
        res.send({user, token});
    }catch(e){
        res.status(400).send(e);
    }
})

//Logout Operation
router.post('/users/logout', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((tokenObject)=>{
            return tokenObject.token !== req.token;
        })
        await req.user.save();

        res.send('You have logged out.');
    }catch(e){
        res.status(500).send();
    }
})

//Logout for all Sessions.
router.post('/users/logoutAll', auth, async(req, res)=>{
    try{
        req.user.tokens = [];

        await req.user.save();
        res.send('You have logged out from all the devices.');
    }catch(e){
        res.status(500).send(e);
    }
})

//Read operation
router.get('/users/me', auth, async (req, res)=>{
    res.send(req.user);
})

//Update Operation
router.patch('/users/me', auth, async(req, res)=>{
    id = req.params.id;
    //To check the property trying to update is exist or not.
    const updates = Object.keys(req.body);
    const allowedupdates = ['name', 'age', 'email', 'password'];

    const isValidOperation = updates.every((update)=> allowedupdates.includes(update));

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid Updates, all the property does not exist.'});
    }

    try{
        const user = req.user;
        updates.forEach((update)=> user[update] = req.body[update])
        await user.save();
        res.send(user);
    }catch(e){
        res.status(400).send(e);
    }
})

//Delete Operation
router.delete('/users/me', auth, async(req, res)=>{
    const id = req.user._id;
    try{
        await req.user.remove();
        sendSignoffEmail(req.user.email, req.user.name)
        res.send(req.user);
    }catch(e){
        res.status(500).send();
    }
})


//Profile Picture Upload
const upload = multer({
    // dest: 'avatars',
    limit: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        // if(!file.originalname.endsWith('.pdf')){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ //Regular expression
            return cb(new Error('Please Upload a JPG, JPEG, PNG file only.'));
        }
        cb(undefined, true);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
   res.send();
},(error, req, res, next)=>{
    res.status(400).send({error: error.message});
})

//Delete Profile Piucture
router.delete('/users/me/avatar', auth, async (req, res)=>{
    try{
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    }catch(e){
        console.log(e);
        res.status(500).send();
    }
})

//Upload on the url to get it back as URL.
router.get('/users/:id/avatar', async(req, res)=>{
    try{
        const user = await User.findById(req.params.id);
        if(!user || !user.avatar){
            throw new Error('Avator Does not exist.');
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    }catch(e){
        res.status(404).send({error: e.message});
    }
})


module.exports = router;