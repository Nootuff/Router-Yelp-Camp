const { campgroundSchema } = require("./schemas.js") //Imports the code from this js document, this our or joi schema. The name of this const is campgroundSchema, this const is destructured. In the validateCampground function below the Joi code this const holds is being used. validateCampground is being used in the post and put routes below, the Joi code in this const is being used as part of that. 

const { reviewSchema } = require("./schemas.js") //Imports the code from this js document, this our or joi schema. this const is destructured. In the validateReview function below the Joi code this const holds is being used. You could probably destructure this and combine it with the campgroundSchema const above if you wanted.

const Review = require("./models/review");

const ExpressError = require("./utilities/ExpressError"); //Imports the function from ExpressError.js. 

const Campground = require("./models/campground"); //imports the Mongoose schema template from campground.js in the models folder.



module.exports.isLoggedIn = (req, res, next) => { //All middleware have req, res and next. The module.exports is exporting this meaning it an be used in other files.
    console.log(req.user);
    if (!req.isAuthenticated()) { //isAuthenticated is a method bought in by passport. It detects if the currect user is logged in (Authenticated)
        console.log(req.originalUrl);
        req.session.returnTo = req.originalUrl //originalUrl holds the URL they are requesting/page they want to go to when they hit the login screen maybe? returnTo will be the url we redirect the user back to. I think putting req.session before it adds the data of what they were trying to access to their session cookies.
        req.flash("error", "You must be signed in to do this.");
        return res.redirect("/login"); //These things activate if the user does not read as logged in. Always have a return on a redirect in an if statement. 
    }
    next();
}

module.exports.validateCampground = (req, res, next) => { //THis is middleware I think. I think it stops you creating or editing a campground to have an empty data field. 
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(element => element.message).join(",")//The map() method creates a new array populated with the results of calling a provided function on every element in the calling array. If there is an error, this maps over the details of the error(error.details) to create a single string message which is then passed to the new ExpressError. This happens if there is an error.
        throw new ExpressError(msg, 400)
    } else {
        next(); //If there is no error then move on to the next thing. The next() function is called in order to continue on executing the middleware and trigger the route code which comes after that block.
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const idHolder = req.params.id; //Holds the current campground id taken from the URL.
    const campground = await Campground.findById(idHolder); //Finds a campground in the database with that id
    if (!campground.author.equals(req.user._id)) {//Look to see uf ther user whose logged in right now's Id matches the campground you found's author id.	If the campgrounds' author is not the same as the current users Id, then show this flash error and redirect back to current campground. This if statement prevents people hacking in campground edits without being logged in like if they log in to a different account and just put "/edit"  into the URL.
        req.flash("error", "You do not have permission to do this.");
        return res.redirect(`/campgrounds/${idHolder}`);
    }
    next(); //If a user has permission to change this campground move on.
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const idHolder = req.params.id; //Holds the current campground id taken from the URL. Becasue of the router stuff in app.js, the full url in the reviews delete route is /campgrounds/:id/reviews/:reviewId referencing the campground id too so you'd have access to that id in the url.  
       const reviewIdHolder = req.params.reviewId; //Holds the current review id taken from the URL. If you look at reviews.js, at the delete route, you can see this is is the url in that route, not sure what that means but it is a link between them.
       const review = await Review.findById(reviewIdHolder); //Finds a review in the database with that id.
           
       if (!review.author.equals(req.user._id)) {//Look to see uf ther user whose logged in right now's Id matches the review you found's author id.	If the reviews' author is not the same as the current users Id, then show this flash error and redirect back to current campground. This if statement prevents people deleting reviews through hacking.
           req.flash("error", "You do not have permission to do this.");
           return res.redirect(`/campgrounds/${idHolder}`); //Redirect to current campground page. 
       }
       next(); //If a user has permission to change this campground move on.
   }

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body) //We pass the entire body including the review infromation, rating and body 
    if (error) {
        const msg = error.details.map(element => element.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next(); //If there is no error then move on to the next thing.
    }//This is another middleware designed to validate reviews. 
}