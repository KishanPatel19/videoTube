class ApiError extends Error{
    constructor(
        statusCode,
        message="Somthing went wrong !",
        errors = [],
        statck=""
    ){
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        this.message=message
        this.success=false
        this.data=null

        if(statck){
            this.statck=statck
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}