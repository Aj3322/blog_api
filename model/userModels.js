const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Please tell your name"] },
    email: { type: String, required: [true, "Please tell your email address"], lowercase: true, unique: true, validate: [validator.isEmail, 'Please provide a valid email address'] },
    role: { type: String,enum: ['user','admin','guide','guide-leader'],default:'user'},
    password: { type: String, required: [true, "Please provide a password"], minLength: 8, select: false },
    photo: { type: String, required: false },
    confirmPassword: {
        type: String,
        required: [true, "Please confirm your password"],
        validate: {
            validator: function (val) {
                return val === this.password;
            },
            message: "Passwords are not the same"
        }
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordExpireToken: Date,
});


userSchema.pre('save', async function (next) {
    if (!this.isModified("password")||this.isNew) return next();
    this.passwordChangeAt = Date.now(); 
    next();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        this.confirmPassword = undefined;
        next();
    } catch (error) {
        return next(error);
    }
});

userSchema.methods.correctPassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changePasswordAtt = function (JWTTimestamp) {
    if(this.passwordChangeAt){
     const changePasswordAt = parseInt(this.passwordChangeAt.getTime()/1000, 10);
     console.log('Change Password At:', changePasswordAt);
     console.log('JWT Timestamp:', JWTTimestamp);
     console.log('Comparison Result:', JWTTimestamp < changePasswordAt);
     return  JWTTimestamp < changePasswordAt;
    }
    return false; 
 }

 userSchema.methods.createPasswordResetToken = function () {

    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordExpireToken = Date.now() + 10 * 60 * 1000;
    console.log({resetToken},this.passwordResetToken,this.passwordExpireToken);
    return resetToken;
 };


 
 
const User = mongoose.model('User', userSchema);
module.exports = User;
