const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const upload = require('express-fileupload')


const userRoutes = require('./routes/userRoutes')
const postRoutes = require('./routes/postRoutes')
const {notFound , errorHandler} = require('./middleware/errorMiddleware');

const app = express()

app.use(express.json({extended: true}))
app.use(express.urlencoded({extended: true}))
app.use(cors({credentials: true, origin: 'http://localhost:5173'}))
app.use(upload())
app.use('/uploads', express.static(__dirname + '/uploads'))


app.use('/api/users' , userRoutes)
app.use('/api/posts' , postRoutes)

app.use(notFound)
app.use(errorHandler)






//============Connection To DataBase & port listening==============//
let URL = process.env.MONGO_URI

mongoose.connect(URL).then((res)=>{
    console.log("Database Connected 🌐")
}).catch((err)=>{
    console.log(err)
})


const Port = process.env.PORT;
app.listen(Port,function () {
    console.log(`App Run @${Port} 🛜`)
})



