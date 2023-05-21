//jshint esversion:6
require("dotenv").config();
const express =require("express");
const bodyParser =require("body-parser");
const mongoose = require('mongoose');
const app = express();
const encrypt=require("mongoose-encryption");


app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/SecretDB').then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.log('Error connecting to MongoDB', error);
});
const userSchema =  new mongoose.Schema ({
  email: String,
  password: String

});
var secret = process.env.SECRET;
userSchema.plugin(encrypt, { secret: secret ,excludeFromEncryption: ['password']});

const User = mongoose.model("User",userSchema);

app.get("/",function(req,res){
    res.render("home");
})
app.get("/register",function(req,res){
  res.render("register");
})
app.get("/login",function(req,res){
  res.render("login");
})
app.post("/register",function(req,res){
  const newUser= new User({
    email:req.body.username,
    password:req.body.password
  })
  newUser.save().then(() => {
    console.log('New User registered',newUser);
    res.redirect("login");

  }).catch((error) => {
    console.log('Error in registration', error);
  });
})
app.post("/login",function(req,res){
 const requser=req.body.username;
 const reqpass=req.body.password
 User.findOne({email:requser,password :reqpass}).then(() => {

  console.log('login successfull');
  res.render("secrets");

}).catch((error) => {
  console.log('Error in login', error);
});
})
app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
  });
  