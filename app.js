//jshint esversion:6
require("dotenv").config();
const express =require("express");
const bodyParser =require("body-parser");
const ejs=require("ejs");
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require('mongoose-findorcreate');
var GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const app = express();

app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/SecretDB').then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.log('Error connecting to MongoDB', error);
});
const userSchema =  new mongoose.Schema ({
  email: String,
  password: String,
  googleId:String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});


passport.use(new GoogleStrategy({
  clientID:     process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL:"'https://www.googleapis.com/oauth2/v3/userinfo",
  passReqToCallback   : true
},
function(request, accessToken, refreshToken, profile, done) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return done(err, user);
  });
}
));



app.get("/",function(req,res){
    res.render("home");
})
app.get("/register",function(req,res){
  res.render("register");
})
app.get("/login",function(req,res){
  res.render("login");
})
app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'profile' ] }
));
app.get( '/auth/google/secrets',
passport.authenticate('google', { failureRedirect: "/login" }),
function(req, res) {
  res.redirect("/submit");
});
app.get("/secrets",function(req,res){
  User.find({"secret": {$ne: null}}).then((foundUsers)=>{res.render("secrets", {usersWithSecrets: foundUsers});
}).catch((error) => {
  console.log('Error', error);
});
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
})
app.post("/submit",function(req,res){
  const submittedSecret =req.body.secret;
  User.findById(req.user.id).then((founduser) => {
    founduser.secret=submittedSecret;
    founduser.save().then(()=>{
      res.redirect("/secrets");
    }).catch((error) => {
      console.log('Error', error);
    });
})
});

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
  if (err) {
  return next(err);
  }
  res.redirect('/');
  });
  });

app.post("/register",function(req,res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
});
app.post("/login",function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });
})
app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
  });
  