import connectDB from "./src/db/connectDB.js";
import app from "./src/utils/app.js";
import dotenv from "dotenv";  

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error", error => {
      console.log(error);
    });   

    app.listen(process.env.PORT || 3000, () => {
      console.log(`SERVER is running at port : ${process.env.PORT}`);
      

      
    });
  })
  .catch(err => {
    console.log("Mongodb connection failed", err);
  });
