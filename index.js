import express from "express";
import path from "path";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { stringify } from "querystring";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

mongoose.connect("mongodb://127.0.0.1:27017",{
    dbName: "backend",
}).then(()=>console.log("database connected.")).catch(e=> console.log(e));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});

const User = mongoose.model("User", userSchema);
const app = express();

app.use(express.static(path.join(path.resolve(),"public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine" , "ejs");
app.use(cookieParser());

const isAuthenticated = async(req,res,next)=>{
    const {token} = req.cookies;
    if(token){
        const decoded = jwt.verify(token, "dewfrtyguio");
        req.user= await User.findById(decoded._id);
        next();
    }
    else{
        res.redirect("/login");
    }
};

app.get("/", isAuthenticated, (req,res) => {
    res.render("logout",{name: req.user.name});
    });

app.get("/register", (req,res)=>{
    res.render("register");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.post("/login",async(req,res)=>{
    const {email, password} = req.body;
    let user = await User.findOne({email});

    if(!user){
        res.redirect("/register");
    }
    else{
       const isPassCorrect = (user.password === password);
       if(!isPassCorrect){
           return res.render("login", {email, message: "Incorrect Password"});
       }
       else{
        const token = jwt.sign({_id: user._id},"dewfrtyguio");
        res.cookie("token", token,{
        httpOnly: true,
        expires: new Date(Date.now() + 60*1000),
    });
    res.redirect("/");
       }
    }

});

app.post("/register", async(req, res)=>{
    const {name,email,password} = req.body;
    let user = await User.findOne({email});
    if(user){
        return res.redirect("/login");
    }
    const hashedPassword = await bcryptjs.hash(password,10);


    user = await User.create({
        name,
        email,
        password: hashedPassword,
    });
    const token = jwt.sign({_id: user._id},"dewfrtyguio");
    res.cookie("token", token,{
        httpOnly: true,
        expires: new Date(Date.now() + 60*1000),
    });
    res.redirect("/");

});

app.post("/login",async(req,res)=>{

    const {name,email} = req.body;
    let user = await User.findOne({email});
    if(!user){
        return res.redirect("/register");
    }
    user = await User.create({
        name,
        email,
    });
const token = jwt.sign({_id: user._id},"dewfrtyguio");
    res.cookie("token", token,{
        httpOnly: true,
        expires: new Date(Date.now() + 60*1000),
    });
    res.redirect("/");
});

app.get("/logout", (req,res) => {
    res.cookie("token",null,{
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");
});

/*
app.get("/add", async(req,res) => {
    // await msg.create({name: "sampleName", email: "smaple_id@gmail.com"});
    await msg.create({name: "Shreyans Jain", email: "jain.shreyans03@gmail.com"});
        res.send("Nice");
      });
*/
app.listen(3000, ()=>{
    console.log("Server is working!");
})

