const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const debug = require('debug')('app:auth:model');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, 'Please enter a valid email address'],
    },
    // FIX 1: Remove required: true. Users from Google won't have a password.
    password: {
        type: String,
        minlength: 6,
        // Optional select: false prevents the hashed password from being 
        // leaked in API responses by default.
        select: false 
    },
    // FIX 2: Store the unique Google ID (the 'sub' field)
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple users to have 'null' (local users)
    },
    // FIX 3: Store the profile picture URL from Google
    avatar: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ['user', 'primeUser', 'admin'],
        default: 'user',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    contacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    preferredLanguage: {
        type: String,
        default: 'en',
        required: true,
        trim: true
    }
}, { timestamps: true });

// PASSWORD HASHING MIDDLEWARE
userSchema.pre("save", async function(next) {
    // Only hash if there's a password and it's being modified
    if (!this.password || !this.isModified("password")) {
        return next();
    }

    try {
        this.password = await bcrypt.hash(this.password, 10);
        debug(`Password for user ${this.email} successfully hashed.`);
        next();
    } catch (error) {
        debug(`Error hashing password: ${error.message}`);
        console.log("error is here");
        
        next(error);
    }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    // Safety check in case a Google user tries to login with a blank password
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
}

const User = mongoose.model("User", userSchema);
module.exports = User;