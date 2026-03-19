import { app } from "./src/app"
import { connectToDB } from "./config/db";


app.listen(3000, () => {
  console.log("Server is running on port 3000")
})

connectToDB();
