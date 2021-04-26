const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task.js')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        default: 0,
        validate(value){
            if(value < 0){
                throw new Error('Age must be a positive number.');
            }
        }
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalide.');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Your password can not contain, "password".')

            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer 
    }
},{
    timestamps: true
})

userSchema.methods.toJSON = function (){
    const user = this;

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    return userObject;
}

//Createing Join(referencing tasks(Task model) created by user)
userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//'methods' are accessable on instances.
userSchema.methods.generateAuthToken = async function () {
    const user = this;
    const token = jwt.sign( { _id: user._id.toString()}, process.env.JWT_SECRET);

    user.tokens = user.tokens.concat( { token })
    await user.save();
    return token;
}

//'statics' methonds are acceseble on models(like static functions in cpp).
userSchema.statics.findByCredentials = async(email, password)=>{
    const user = await User.findOne({email});
    if(!user){
        throw new Error('Unable to login.');
    }
    isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        throw new Error('Unable to login.');
    }

    return user;
}

//hashed the plain text to convert into encrypted password before save operation.
userSchema.pre('save', async function(next){
    const user = this;
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }
    next();
})

//Delete user tasks before the user is removed.
userSchema.pre('remove', async function(next){
    const user = this;
    await Task.deleteMany({owner: user._id});
    next();
})

const User = mongoose.model('User',userSchema );

module.exports = User;