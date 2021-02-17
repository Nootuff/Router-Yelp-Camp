const express = require('express');
const router = express.Router({mergeParams:true} ); //mergeParams is neccessary in this router version of the app because, express router gets some kind of different params to if these routes were on a normal app.js file. It makes the params you would get access to on a normal app.js file available in this router version. The params in question here are the campground ids. This is not necessary in campgrounds.js becasue the id we need in the campground routes is already in the routes on that page whereas on this page id is part of the route on app.js under app.use('/campgrounds/:id/reviews', reviews).

const catchAsync = require("../utilities/catchAsync"); //Notice the two dots, these are here because these files are being requested from a folder 1 level up from the current folder, this file path goes up one level and then into utilities. Imports the function in catchAsync.js, allows us to do async error handling.
const Campground = require("../models/campground"); //imports the Mongoose schema template from campground.js in the models folder.
const Review = require("../models/review") //Imports the review schema.

const { reviewSchema } = require("../schemas.js") //Imports the code from this js document, this our or joi schema. this const is destructured. In the validateReview function below the Joi code this const holds is being used. 

const { validateReview, isLoggedIn, isReviewAuthor } =require("../middleware"); //Imports in the middlwares from middleware.js. 

const ExpressError = require("../utilities/ExpressError"); //Imports the function from ExpressError.js.

router.post("/", isLoggedIn, validateReview, catchAsync(async (req, res) => { //Middlewares make sure there's something in teview text fields and a user is logged in to make the comment. 
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review); //Create a new instance of a review from the Review model.
    review.author = req.user._id;
    campground.reviews.push(review); //Push the newly created review into the reviews object of the campground whose id you have accessed.
    await review.save(); //The .save() method moves your data to the database collection.
    await campground.save();
    req.flash("success", "Thanks for your feedback");
    res.redirect(`/campgrounds/${campground._id}`);
}));

router.delete("/:reviewId", isLoggedIn, isReviewAuthor, catchAsync(async (req, res) => { //This will remove the reference to the review in the campground and reemove the review itself. Becasue of the router stuff in app.js, the full url here is /campgrounds/:id/reviews/:reviewId referencing the campground id too. 
    const id = req.params.id
    const reviewId = req.params.reviewId
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});//This lets you delete the object id that corresponds to that review from the campground.The $pull operator removes from an existing array all instances of a value or values that match a specified condition. This pulls the review with the review id from the url our of the reviews array of the campground with the id from the url. 
    await Review.findByIdAndDelete(reviewId); //This deletes the review with the url id from the reviews collections as well. 
    res.redirect(`/campgrounds/${id}`)//Sends you back to the campground page with the url id usgin a string template literal. 
}))

module.exports = router;