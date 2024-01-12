import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotification extends Document{
  title: string;
  status: string;
  userId: string;
  message: string;
}

const notificationSchema= new Schema<INotification>({
  title:{
    type:String,
    required:true
  },
  status:{
    type:String,
    required:true,
    default:'unread'
  },
  message:{type:String, required:true},

  userId:{type:String, required:true}
})

const notificationModel:Model<INotification>=mongoose.model("Notification",notificationSchema);
export default notificationModel;