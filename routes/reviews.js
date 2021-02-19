const express = require('express');
const router = express.Router({ mergeParams: true }); //mergeParams is neccessary in this router version of the app because, express router gets some kind of different params to if these routes were on a normal app.js file. It makes the params you would get access to on a normal app.js file available in this router version. The params in question here are the campground ids. This is not necessary in campgrounds.js becasue the id we need in the campground routes is already in the routes on that page whereas on this page id is part of the route on app.js under app.use('/campgrounds/:id/reviews', reviews).

const catchAsync = require("../utilities/catchAsync"); //Notice the two dots, these are here because these files are being requested from a folder 1 level up from the current folder, this file path goes up one level and then into utilities. Imports the function in catchAsync.js, allows us to do async error handling.
const Campground = require("../models/campground"); //imports the Mongoose schema template from campground.js in the models folder.
const Review = require("../models/review") //Imports the review schema.
const reviews = require("../controllers/reviews") //Imports Controller funcs

const { reviewSchema } = require("../schemas.js") //Imports the code from this js document, this our or joi schema. this const is destructured. In the validateReview function below the Joi code this const holds is being used. 

const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware"); //Imports in the middlwares from middleware.js. 

const ExpressError = require("../utilities/ExpressError"); //Imports the function from ExpressError.js.

router.post("/", isLoggedIn, validateReview, catchAsync(reviews.createReview)); //Uses controller functions from reviews.js

router.delete("/:reviewId", isLoggedIn, isReviewAuthor, catchAsync(reviews.deleteReview))

module.exports = router;