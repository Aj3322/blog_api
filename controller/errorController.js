const AppError = require('../utils/appError');

const handleCastErrorDB= (err) =>{
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handleDublicateFieldDB = (err) =>{
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);
    const message = `Dublicate Field Value : ${value}. Please use another value `;
    return new AppError(message,400);
}

const handleEmailError= (error) => {
    return new AppError('Please enter a valid email address',400);
}
const handleValidationErrorDB = (err) =>{
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid Input data: ${errors.join('. ')}`;
    return new AppError(message,400);
}

const handleJwtError = err => new AppError(err.message, 401);
const sendErrorDev=(err, res)=>{
    console.log(err.stack.red);
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack
    });
} 
const sendErrorProd = (err, res) => {
    //operational, trusted error for sent to client
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
        //programming or other unknown error
    }else{
        //console log it and send a generic  msg to the user
        console.log(err);
        res.status(500).json({
            status: err.status,
            message:'Something went very wrong!'
        })
    };
};

module.exports = (err,req,res,next) => {
    err.statusCode = err.statusCode||500;
    err.status = err.status || 'error';

    if(process.env.NODE_ENV === 'development'){

        sendErrorDev(err,res);
    } else if(process.env.NODE_ENV === 'production'){
        let error = {...err};

        if(error.status === 'CastError') error = handleCastErrorDB(error);
        if(error.code === 11000) error = handleDublicateFieldDB(error);
        if(error.name === 'ValidationError') error = handleValidationErrorDB(error);
        if(error.name === 'JsonWebTokenError') error = handleJwtError(error);
        if(error.message === 'Expected a string but received a Object') error = handleEmailError(error);

        sendErrorProd(error,res);
    }
};
