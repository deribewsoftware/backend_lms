import mongoose from 'mongoose'
require('dotenv').config()

const db_url:string=process.env.DB_URL || ""
 const connectDb=async()=>{
  try{

    await mongoose.connect(db_url).then((data:any)=>{
      console.log("database connection:",data.connection.host)
    })

  }
  catch(error:any){
    console.log(error.message);
    setTimeout(connectDb,5000)

  }

 }
 export default connectDb;