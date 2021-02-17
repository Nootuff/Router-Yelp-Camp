const Campground = require("../models/campground"); //imports the Mongoose schema template from campground.js in the models folder.

const Review = require("../models/review") //Imports the review schema.

module.exports.createReview = async (req, res) => { //Middlewares make sure there's something in teview text fields and a user is logged in to make the comment. 
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review); //Create a new instance of a review from the Review model.
    review.author = req.user._id;
    campground.reviews.push(review); //Push the newly created review into the reviews object of the campground whose id you have accessed.
    await review.save(); //The .save() method moves your data to the database collection.
    await campground.save();
    req.flash("success", "Thanks for your feedback");
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteReview = async (req, res) => { //This will remove the reference to the review in the campground and reemove the review itself. Becasue of the router stuff in app.js, the full url here is /campgrounds/:id/reviews/:reviewId referencing the campground id too. 
    const id = req.params.id
    const reviewId = req.params.reviewId
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});//This lets you delete the object id that corresponds to that review from the campground.The $pull operator removes from an existing array all instances of a value or values that match a specified condition. This pulls the review with the review id from the url our of the reviews array of the campground with the id from the url. 
    await Review.findByIdAndDelete(reviewId); //This deletes the review with the url id from the reviews collections as well. 
    res.redirect(`/campgrounds/${id}`)//Sends you back to the campground page with the url id usgin a string template literal. 
}