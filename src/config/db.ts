import mongoose from "mongoose";
import { exit } from "process";

export const connectDB = async () => {
    try {
        const {connection} = await mongoose.connect(process.env.DATABASE_URL)
        const url = `${connection.host}: ${connection.port}`
        console.log(`Database connected on ${url}`);
        
    } catch (error) {
        console.log(error);
        exit(1);
    }
}