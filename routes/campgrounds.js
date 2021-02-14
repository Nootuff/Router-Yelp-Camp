const express = require('express');
const router = express.Router();
const catchAsync = require("../utilities/catchAsync"); //Notice the two dots, these are here because these files are being requested from a folder 1 level up from the current folder, this file path goes up one level and then into utilities. Imports the function in catchAsync.js, allows us to do async error handling.
const Campground = require("../models/campground"); //imports the Mongoose schema template from campground.js in the models folder.
const { isLoggedIn, isAuthor, validateCampground } = require("../middleware"); //Imports these middleware functions from the middleware file. This is a destructured const. The names by which they are invoked in the routes are also calling them from the middleware file. 

const Joi = require('joi'); //This is used for error handling 

router.get("/", catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({}) //Find everything in campgrounds collection. This const holds them all. Becasue of await, render doesn't occur until campgrounds has gathered all data. 
    res.render("campgrounds/index.ejs", { campgrounds }); //pass them to the ejs document
}));

router.get("/new", isLoggedIn, function (req, res) { //isLoggedIn is the the middlewar function, detects whether a user has logged in otherwise they cannot view this route. Note no async, no mongoose / db stuff here, no need for it, no data being reqeusted.
    res.render("campgrounds/new.ejs");
});

router.get("/:id", catchAsync(async (req, res) => { //Note that this has to be a lower  get route on the page or the system will interpret anything anything entered into the url after campgrounds/ as the :id you are attempting to search for eg. system will attempt to search for something with the the id of "new" instead of loading the "new" route. This must be lower as the system goes vertically down the page, the system will look at everything above it first. 
    const campground = await Campground.findById(req.params.id).populate("reviews").populate("author"); //The ID is taken from the url I think. The id is taken from the url and fed into .findById() which is a mongoose method which scans the Campground schema. The .populates are unpacking data stored as objectIds in the campground schema that are actually data from other schemas / databases namely reviews and users and making it available on the campground details page. 
    console.log(campground);
    if (!campground) { //If mongoose didn't find a campground with that id, flash error then redirect
        req.flash("error", "Sorry that campground does not exist.");
        return res.redirect("/campgrounds") //No idea why return is needed here.
    }
    res.render("campgrounds/details.ejs", { campground });
}));

router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(async (req, res) => { //isLoggedIn & isAuthor are both middleware that will run before the rest of this route runs. isAuthor prevents you from even accessing the edit route when logged in with a different user. 
    const campground = await Campground.findById(req.params.id);
    if (!campground) { //If mongoose didn't find a campground with that id for user to edit, flash error then redirect
        req.flash("error", "Sorry that campground does not exist.");
        return res.redirect("/campgrounds") //No idea why return is needed here but you always have one on a redirect in an if statment. 
    }
    res.render("campgrounds/edit.ejs", { campground }); //pass them to the ejs document
}));

router.post("/", isLoggedIn, validateCampground, catchAsync(async (req, res, next) => {//catchAsync is the function being imported above for the js file with the same name, it is the async error handling in this function. You need the isLoggedIn middleware here to make sure no one can use Postman or Ajax or something ot access this post route when they are not loggedin, it's protection.
    console.log(req.body.campground);
    const campground = new Campground(req.body.campground); //No idea what req.body.campground actually is or what "campground" refers to, possibly the object that is created in new.ejs in that form, from the data that is inputted. 
    campground.author = req.user._id; //req.user is automatically added in, they have to be logged in to even reach this create campground page, the user details are taken from that somehow. The author value of this campground is set to the user._id of the user who made this post request.
    await campground.save(); //The await means the .save() has to happen before the redirect can run.
    req.flash("success", "You've created a new campground!"); //Triggers the flash message before the redirect after you create a campground. 
    res.redirect(`/campgrounds/${campground._id}`); //String template literal, note the backticks. Maybe you have to use string template literals for these page addresses? Passing a variable in never seems to work. 
}));

router.put("/:id", isLoggedIn, isAuthor, validateCampground, catchAsync(async (req, res) => {
    const idHolder = req.params.id; //Holds the current campground id taken from the URL?
    const campground = await Campground.findByIdAndUpdate(idHolder, { ...req.body.campground }) //The 3 dots are the spread operator this somehow allows you to use the values contained within the square brackets on the name values in the forms on the new and edit.ejs pages. 
    req.flash("success", "You've successfully updated this campground!");
    res.redirect(`/campgrounds/${campground._id}`);
}));

router.delete("/:id", isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const idHolder = req.params.id;
    await Campground.findByIdAndDelete(idHolder);
    req.flash("success", "Campground deleted.")
    res.redirect("/campgrounds");
}));

module.exports = router;