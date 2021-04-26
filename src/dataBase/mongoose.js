const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URL, 
{
    useNewUrlParser: true, useUnifiedTopology: true, 
    useCreateIndex: true}).then((result)=>{
    console.log('Result : Successful');
}).catch((error)=>{
    console.log(error);
})
