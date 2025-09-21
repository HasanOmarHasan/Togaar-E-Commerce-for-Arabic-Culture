// @desc Reusable Error Class (for error can predict)
class ApiError extends Error {
    constructor(message , codeStatus) {
        super(message); 
        this.codeStatus = codeStatus; 
        this.status = `${codeStatus}`.startsWith(4) ? "fail" : "error";
        this.isOpertional = true; 

    }
}


module.exports= ApiError