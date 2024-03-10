class AppError extends Error {
    constructor(message,statusCode){
        super(message);

        this.statusCode = statusCode;
        this.status=`${statusCode}`.startsWith('4')?'fail':'error';
        this.isOperational = true;

        Error.captureStackTrace(this,this.constructor);

    }
}
module.exports=AppError;

//How to use it:  
/* 
const appErr = new AppError("Something went wrong",500)
console.log(appErr.toString()) // Custom error message
console.log(appErr.status)     // Http Status Code (either fail or error)
console.log(appErr.isOperational) // True if its operational false otherwise 
*/