const {Schema , model} = require('mongoose')


const userSchema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    avatar: {type: String},
    posts: {type: Number, default: 0},
},
    {timestamp:true , versionKey:false}
)


module.exports = model('User' , userSchema)