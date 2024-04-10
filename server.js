const express = require("express");
const app = express();
const connectDB = require("./db")
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");


app.use(express.json());

const PORT = process.env.PORT || 3000;





admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.post("/register/", async (req, res) => {
    const {email, password} = req.body
    try {
        const userResponse = await admin.auth().createUser({
            email,
            password,
            emailVerified: false,
            disabled: false
        });
        console.log(userResponse);
        res.send(userResponse);
    }
    catch {
        console.log("user already axist");
    }
        
});


connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`server is running on PORT ${PORT}`);
    });
    
});


