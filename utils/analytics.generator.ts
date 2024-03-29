import { Model,Document } from "mongoose";

interface MonthData{
  month: string;
  count: number;
}

export async function generateLast12Monthsdata<T extends Document>(
  model: Model<T>,

):Promise<{last12MonthsData:MonthData[]}>{
  const last12MonthsData:MonthData[]=[];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);

  for(let i=11;i>=0 ;i--){
  
const endDate = new Date(currentDate.getFullYear(),currentDate.getMonth(),currentDate.getDate()-i*28);
const startDate = new Date(endDate.getFullYear(),endDate.getMonth(),endDate.getDate()-28);
const monthYear=endDate.toLocaleString('default',{day:'numeric',month:'short',year:'numeric'});
const count=await model.countDocuments({
  createdAt:{
    $gte:startDate,
    $lt:endDate
  }
})
last12MonthsData.push({month:monthYear,count:count});
  }
  return {last12MonthsData}

}