const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userTemporarySchema = new Schema({
    name: {
        type:String,
        trim:true,
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String
    },
    emailOtp:{
        type:String
    },
    isEmailVerified:{
        type:Boolean,
        default:false
    },
    userType:{
        type:String,
        enum:['docter','user','admin'],
        default:'user'
    },

},
{timestamps:true})

module.exports = mongoose.model('UserTemporary',userTemporarySchema,'UserTemporary');