const express = require('express');
const router = express.Router();
const campgrounds = require("../controllers/campgrounds"); //Imports all of the page's actual functions from controllers.
const catchAsync = require("../utilities/catchAsync"); //Notice the two dots, these are here because these files are being requested from a folder 1 level up from the current folder, this file path goes up one level and then into utilities. Imports the function in catchAsync.js, allows us to do async error handling.
const Campground = require("../models/campground"); //imports the Mongoose schema template from campground.js in the models folder.
const { isLoggedIn, isAuthor, validateCampground } = require("../middleware"); //Imports these middleware functions from the middleware file. This is a destructured const. The names by which they are invoked in the routes are also calling them from the middleware file. 

const multer = require('multer');
const { storage } = require("../cloudinary"); //Apparently the reason so many of your files are named index.js and you don't have to name the file is because node automatically looks for a file named index.js in a folder. Either way, this imports the storage const object from the cloudinary file.
const upload = multer({ storage }); //This will tell the system to upload using the settings of the  storage object

const Joi = require('joi'); //This is used for error handling 

router.get("/", catchAsync(campgrounds.index)); //This route uses the index function from the campgrounds controllers file. All of the old functions that were here have been moved to the campgrounds controllers file, to see how all this used to look and figure out how it all worked before, look at Colt's github repo for section 52.

router.get("/new", isLoggedIn, campgrounds.renderNewForm);

router.get("/:id", catchAsync(campgrounds.showCampground));

router.get("/:id/edit", isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm)); //The order all these middlewares is in is very important. 

router.post("/", isLoggedIn, upload.array("image"), validateCampground, catchAsync(campgrounds.createCampground)); //"image" is the name of the file input on new.ejs, they must match.

router.put("/:id", isLoggedIn, isAuthor, upload.array("image"), validateCampground, catchAsync(campgrounds.updateCampground)); //updateCampground

router.delete("/:id", isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground)); //deleteCampground

module.exports = router;