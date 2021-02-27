/*
User: Adam
pass: Campaign1
email: adamwalkerlondon@gmail.com

User: Temmie
pass: Hoi!
email: tem@gmail.com

User: Teeth
pass: test1
email: teeth@gmail.com

User: Atlas
pass: Atlas21
email: atlas@atlas.com

*/

const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const users = require("../controllers/users") //Imports Controller funcs
const catchAsync = require("../utilities/catchAsync"); //Notice the two dots, these are here because these files are being requested from a folder 1 level up from the current folder, this file path goes up one level and then into utilities. Imports the function in catchAsync.js, allows us to do async error handling. 


router.get("/register", users.renderRegister);

router.post("/register", catchAsync(users.register));

router.get("/login", users.renderLogin);

router.get("/logout", users.logout);

router.post("/login", passport.authenticate("local", { failureFlash: true, failureRedirect: "/login" }), users.login);

module.exports = router;