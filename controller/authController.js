const crypto = require('crypto');
const { promisfy, promisify } = require('util');
const User = require('../model/userModels');
const catchAsync = require('../utils/asyncCatch');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const sendEmail = require('../email/email');
const validator = require('validator');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cokieOptions = {
        expiresIn: new Date(
            Date.now() + process.env.JWT_COKIE_EXPIRATION * 24 * 60 * 60 * 1000
            ), 
        httpOnly: true
    };
    if(process.env.NODE_ENV === 'production') cokieOptions.secure=true;

    res.cookie('jwt', token,cokieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}
exports.signup = catchAsync(async (req, res, next) => {

    const newUser = await User.create(req.body);
    // Create user

    createSendToken(newUser,200,res);
    // // send response  with token
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!validator.isEmail(email)) {
        return next(new AppError('Please provide a valid email!', 400));
    }

    if (!password) {
        return next(new AppError('Please provide a password!', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new AppError("Email is incorrect", 401));
    } else if (!(await user.correctPassword(password))) {
        return next(new AppError("Password is incorrect", 401))
    }

    //return json web token
    console.log(user);
    createSendToken(user,200,res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token,
    //     user
    // });

});

exports.protect = async function (req, res, next) {
    let token;
    //checking the headers for the token first
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    //    else if (req.cookies.token) {
    //     //console.log('found cookie')
    //      token=req.cookies.token;
    //  }  

    if (!token) {
        return next(new AppError('You  are not logged in! Please login to get access.', 401));
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const freshUser = await User.findById({ _id: decoded.id });
        if (!freshUser) return next(new AppError('The user no longer exists ', 401))
        if (freshUser.changePasswordAtt(decoded.iat)) {
            console.log(freshUser.changePasswordAtt(decoded.iat));
            return next(new AppError('User recently changed password! Please log in again', 401));
        }

        req.user = freshUser;
        next();
    } catch (e) {
        console.log(e);
        return next(new AppError('The token has expired! please log in again.'), 401);

    }
}

exports.restrict = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            console.log(req.user)
            return next(new AppError("You don't have permission to perform this action on this resource", 403));
        }
        next();
    };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    // .select('+passwordResetToken passwordReset' + 'Expire');
    console.log(user);
    if (!user) {
        return next(new AppError("There is no user with that email or the reset password link has expired", 400));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get('host')}/resetPassword/${resetToken}`;

    const message = `Forget your password with the given link ${resetUrl}\n If you are not forget password ignore`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your Password Reset Token valid for 10 min',
            text: `Follow this link to reset your password: ${resetUrl}`
        });

        res.status(200).json({
            status: 'success',
            message: 'Password reset email sent!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordExpireToken = undefined;
        user.save({ validateBeforeSave: false });
        console.log({ err });
        return next(new AppError("There was an error sending the email", 400));
    };
});

exports.resetPassword = catchAsync(
    async (req, res, next) => {
        if (req.body.password !== req.body.confirmPassword) {
            return next(new AppError("Password not matched.", 401));
        }
        if (!req.body.password || !req.body.confirmPassword) {
            return next(new AppError("Please enter your password and confirm password.", 401));
        }
        //(1) Get user based on the token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        console.log(hashedToken);
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordExpireToken: {
                $gt: Date.now()
            }
        });

        //(2) If token has not expired, and there is a user, set a new password
        if (!user) {
            return next(new AppError("User not found or token has expired.", 404));
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordExpireToken = undefined;
        await user.save();


        //(3) Log the user in, send JWT
        createSendToken(user,200,res);
        // const token = signToken(user._id);
        // res.status(200).json({
        //     status: 'success',
        //     token
        // });
    });

exports.updatePassword = catchAsync(async function (req, res, next) {
    //(1) Get the user from the collection

    const user = await Users.findById(req.user.id).select('+password');

    if (!user.correctPassword(req.body.currentPassword)) {
        return next(new AppError('Your current password is incorrect', 401));
    }


    //(2) Check is Posted current password is correct

    user.password = req.body.password;
    await user.save();


    //(3) If so , update password

    //(4) Log user in , send JWT
    createSendToken(user,200,res);

    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });

});
