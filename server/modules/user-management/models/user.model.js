const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const debug = require('debug')('app:auth:model');

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true,
        trim:true,
        maxlength: 50
    },
    email:{
        type:String,
        required: true,
        unique:true,
        lowercase:true,
        trim:true,
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
    },
    password:{
        type:String,
        required: true,
        minlength: 6,

    },
    role:{
        type:String,
        enum:['user','primeUser','admin'],
        default:'user',
        required:true
    },
    isPublic:{
        type:Boolean,
        default:true,
    },
    contacts:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }],
    preferredLanguage: {
        type: String,
        default: 'en', // ISO 639-1 code (e.g., 'en', 'zh', 'es')
        required: true,
        trim: true
    }

},{timestamps:true});

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")){
        return next();
    }

    try {
        this.password = await bcrypt.hash(this.password,10);
        debug(`Password for user ${this.email} successfully hashed.`);
        next();
    } catch (error) {
        debug(`Error hashing password for user ${this.email}: ${error.message}`);
        next(error);
    }
});

userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password);
}

const User = mongoose.model("User",userSchema);

module.exports = User;