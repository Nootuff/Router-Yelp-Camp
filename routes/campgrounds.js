const express = require('express');
const router = express.Router();
const catchAsync = require("../utilities/catchAsync"); //Notice the two dots, these are here because these files are being requested from a folder 1 level up from the current folder, this file path goes up one level and then into utilities. Imports the function in catchAsync.js, allows us to do async error handling.
const ExpressError = require("../utilities/ExpressError"); //Imports the function from ExpressError.js. 
const Campground = require("../models/campground"); //imports the Mongoose schema template from campground.js in the models folder.
const { isLoggedIn } = require("../middleware"); //Imports that function from the middleware file.

const Joi = require('joi'); //This is used for error handling 
const { campgroundSchema } = require("../schemas.js") //Imports the code from this js document, this our or joi schema. The name of this const is campgroundSchema or it could be reviewSchema, this const is destructured. In the validateCampground function below the Joi code this const holds is being used. validateCampground is being used in the post and put routes below, the Joi code in this const is being used as part of that. 

const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(element => element.message).join(",")//The map() method creates a new array populated with the results of calling a provided function on every element in the calling array. If there is an error, this maps over the details of the error(error.details) to create a single string message which is then passed to the new ExpressError. This happens if there is an error.
        throw new ExpressError(msg, 400)
    } else {
        next(); //If there is no error then move on to the next thing. The next() function is called in order to continue on executing the middleware and trigger the route code which comes after that block.
    }
}

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

router.get("/:id/edit", isLoggedIn, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    if (!campground) { //If mongoose didn't find a campground with that id for user to edit, flash error then redirect
        req.flash("error", "Sorry that campground does not exist.");
        return res.redirect("/campgrounds") //No idea why return is needed here but you always have one on a redirect in an if statment. 
    }
    res.render("campgrounds/edit.ejs", { campground }); //pass them to the ejs document
}));

router.post("/", isLoggedIn, validateCampground, catchAsync(async (req, res, next) => {//catchAsync is the function being imported above for the js file with the same name, it is the async error handling in this function. You need the isLoggedIn middleware here to make sure no one can use Postman or Ajax or something ot access this post route when they are not loggedin, it's protection.
    //if(!req.body.campground) throw new ExpressError("incomplete data", 400)
    console.log(req.body.campground);
    const campground = new Campground(req.body.campground); //No idea what req.body.campground actually is or what "campground" refers to, possibly the object that is created in new.ejs in that form, from the data that is inputted. 
    await campground.save(); //The await means the .save() has to happen before the redirect can run.
    req.flash("success", "You've created a new campground!"); //Triggers the flash message before the redirect after you create a campground. 
    res.redirect(`/campgrounds/${campground._id}`); //String template literal, note the backticks. Maybe you have to use string template literals for these page addresses? Passing a variable in never seems to work. 
}));

router.put("/:id", isLoggedIn, validateCampground, catchAsync(async (req, res) => {
    const idHolder = req.params.id;
    const campground = await Campground.findByIdAndUpdate(idHolder, { ...req.body.campground }) //The 3 dots are the spread operator this somehow allows you to use the values contained within the square brackets on the name values in the forms on the new and edit.ejs pages. 
    req.flash("success", "You've successfully updated this campground!");
    res.redirect(`/campgrounds/${campground._id}`);
}));

router.delete("/:id", isLoggedIn, catchAsync(async (req, res) => {
    const idHolder = req.params.id;
    await Campground.findByIdAndDelete(idHolder);
    req.flash("success", "Campground deleted.")
    res.redirect("/campgrounds");
}));

module.exports = router;