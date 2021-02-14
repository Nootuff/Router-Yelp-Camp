const express = require('express');
const mongoose = require('mongoose');
const path = require("path");
const Campground = require("./models/campground"); //imports the Mongoose schema template from campground.js in the models folder.
const Review = require("./models/review"); //Imports the review schema.
const engine = require('ejs-mate');
const flash = require('connect-flash');
const session = require("express-session");
const ExpressError = require("./utilities/ExpressError"); //Imports the function from ExpressError.js.
const methodOverride = require('method-override'); //This first had to be installed with npm install method-override. This package lets you change what forms do in their form actions eg DELETE, look at the pages with forms like the campground details page to see what this looks like.
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user"); //Imports the review schema.
const catchAsync = require("./utilities/catchAsync"); //Imports the function in catchAsync.js, allows us to do async error handling. 
const ejs = require('ejs');

const userRoutes = require ("./routes/users");
const campgroundRoutes = require('./routes/campgrounds');//Imports the campgrounds routes, this is to do with router.
const reviewRoutes = require('./routes/reviews');

mongoose.connect('mongodb://localhost:27017/test', { //This is all part of the mongoose setup. Apparently "test" is the name of the Database everything is being uploaded to, the reviews and the campgrounds also a bunch of movies from your MongooseTest app. This could create a problem later because you copied the origional to create this new version when colt switched to Router. 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
});

const db = mongoose.connection; //No idea what this code does, seems to just put messages in console log
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
});

const app = express();

app.engine('ejs', engine);
app.set("views", path.join(__dirname, "/views"));

app.use(express.urlencoded({ extended: true })); //This is what allows you to parse the data from the form in new.ejs, it is needed to parse form data. 
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname + '/public'))); //This allows you to use the stuff in your public folder like the css doc and the js functions. When we use path.join with __dirname in the combination like that, we ensure that it always gets the correct path to the public folder, regardless of the terminal location from which we run the node command (and regardless of the specific OS file structure and path syntax), even if it's not in the main project folder.

const sessionConfig = {
    secret: "secretGoesHere",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, //This thing is optional, if its included, the cookie cannot be accessed through or interfered with by a client side script. This is extra security. 
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //This is when the cookie is programmed to expire. It is todays date, Date.now is in milliseconds. We want this cookie to expire in a week so the sum is 1000 milliseconds in a second, 60 secs in a minute, 60 mins in an hour, 24 hours etc. So the date it will expire is today's date plus that time.
        maxAge: 1000 * 60 * 60 * 24 * 7
        //All this expiration stuff is because we don't want users to log in and stay logged in, they will get logged out after a week? 
    }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); //User is the const with your user schema. This line of code is telling the app to use LocalStrategy and the authentication method will be located on the User model and the method is called "authenticate", there is no method in user.js because passport-local imports it itself.

passport.serializeUser(User.serializeUser());//This is something relating to storing the user in the session. Once again, "User" is the const holding our user schema. 
passport.deserializeUser(User.deserializeUser());//This lets you get the user out of the session, remove them from the session's storage. serializeUser and deserializeUser are methods bought in from passport, you didn't write them. 

app.use(function (req, res, next) {//has to come before the route handlers below apparently  
    res.locals.currentUser = req.user; //This checks to see if the user is logged in or not. req.user contains the authenticated user object (with the user fields saved in the database) and it is set automatically by the Passport.js middleware after a successful login (which we configured to use the local strategy). You can access it whereever you have access to the req, res objects - basically in the route callback functions. It's very useful if you want to access data from the currently logged in user.In that scenario, we are using it to pass the details of the currently logged in user to all our EJS views, under the name currentUser. Whatever is attached to the res.locals object in Express gets passed to the rendered EJS view automatically. We create that app.use() middleware function to pass the logged in user object to each EJS view in our app, under the name currentUser.
    res.locals.successFlash = req.flash("success"); //"success" and "failure" must be lowercase for the flash system to work. 
    res.locals.errorFlash = req.flash("error");
    next();
})

app.use("/", userRoutes) //These are "route handlers".
app.use('/campgrounds', campgroundRoutes)//All the route paths in campgrounds.js all now start with "campgrounds" becasue of router. These are called "route handlers"
app.use('/campgrounds/:id/reviews', reviewRoutes) //All the route paths in campgrounds.js all now start with "campgrounds/:id/reviews"

const Joi = require('joi'); //This is used for error handling 
const { campgroundSchema, reviewSchema } = require("./schemas.js") //Imports the code from this js document, this our or joi schema. The name of this const is campgroundSchema or it could be reviewSchema, this const is destructured. In the validateCampground function below the Joi code this const holds is being used. validateCampground is being used in the post and put routes below, the Joi code in this const is being used as part of that. 



/*
const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(element => element.message).join(",")//The map() method creates a new array populated with the results of calling a provided function on every element in the calling array. If there is an error, this maps over the details of the error(error.details) to create a single string message which is then passed to the new ExpressError. This happens if there is an error.
        throw new ExpressError(msg, 400)
    } else {
        next(); //If there is no error then move on to the next thing.
    }
}
*/

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body) //We pass the entire body including the review infromation, rating and body 
    if (error) {
        const msg = error.details.map(element => element.message).join(",")
        throw new ExpressError(msg, 400)
    } else {
        next(); //If there is no error then move on to the next thing.
    }//This is another middleware designed to validate reviews. 
}

app.get("/", function (req, res) {
    res.render("home.ejs");
});

/*
app.get("/makecampground", async(req, res)=>{ //this is creating a new object in the "campgrounds" collection in  the "yelp-camp" database and the title value is being set to "My backyard", this is being uploaded to the database and it makes use of const Campground at the top of this page, note the syntax here. No longer important. 
    const camp = new Campground({title: "My backyard"});
    await camp.save();
        res.send(camp);
        });


//The computer works it's way down this page until it finds a route to activate based on what the user has done eg. what url they have accessed. The async functions appear to be used to prevent the functions from doing anything until the data has been retreived from the mongo database and stored in a const to be sent to the new page.  

app.get("/campgrounds", catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({}) //Find everything in campgrounds collection. This const holds them all. Becasue of await, render doesn't occur until campgrounds has gathered all data. 
    res.render("campgrounds/index.ejs", { campgrounds }); //pass them to the ejs document
}));

app.get("/campgrounds/new", function (req, res) { //Note no async, no mongoose / db stuff here, no need for it, no data being reqeusted. 
    res.render("campgrounds/new.ejs");
});

app.get("/campgrounds/:id", catchAsync(async (req, res) => { //Note that this has to be a lower  get route on the page or the system will interpret anything anything entered into the url after campgrounds/ as the :id you are attempting to search for eg. system will attempt to search for something with the the id of "new" instead of loading the "new" route. This must be lower as the system goes vertically down the page, the system will look at everything above it first. 
    const campground = await Campground.findById(req.params.id).populate("reviews"); //The ID is taken from the url I think. The id is taken from the url and fed into .findById() which is a mongoose method which scans the Campground schema. 
    console.log(campground);
    res.render("campgrounds/details.ejs", { campground });
}));

app.get("/campgrounds/:id/edit", catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render("campgrounds/edit.ejs", { campground }); //pass them to the ejs document
}));

app.post("/campgrounds", validateCampground, catchAsync(async (req, res, next) => {//catchAsync is the function being imported above for the js file with the same name, it is the async error handling in this function. 
    //if(!req.body.campground) throw new ExpressError("incomplete data", 400)
    console.log(req.body.campground);
    const campground = new Campground(req.body.campground); //No idea what req.body.campground actually is or what "campground" refers to, possibly the object that is created in new.ejs in that form, from the data that is inputted. 
    await campground.save(); //The await means the .save() has to happen before the redirect can run. 
    res.redirect(`/campgrounds/${campground._id}`); //String template literal, note the backticks. Maybe you have to use string template literals for these page addresses? Passing a variable in never seems to work. 
}));

app.put("/campgrounds/:id", validateCampground, catchAsync(async (req, res) => {
    const idHolder = req.params.id;
    const campground = await Campground.findByIdAndUpdate(idHolder, { ...req.body.campground }) //The 3 dots are the spread operator this somehow allows you to use the values contained within the square brackets on the name values in the forms on the new and edit.ejs pages. 
    res.redirect(`/campgrounds/${campground._id}`);
}));

app.delete("/campgrounds/:id", catchAsync(async (req, res) => {
    const idHolder = req.params.id;
    await Campground.findByIdAndDelete(idHolder);
    res.redirect("/campgrounds");
}));

app.post("/campgrounds/:id/reviews", validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review); //Create a new instance of a review from the Review model.
    campground.reviews.push(review); //Push the newly created review into the reviews object of the campground whose id you have accessed.
    await review.save(); //The .save() method moves your data to the database collection.
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

app.delete("/campgrounds/:id/reviews/:reviewId", catchAsync(async (req, res) => { //This will remove the reference to the review in the campground and reemove the review itself.
    const id = req.params.id
    const reviewId = req.params.reviewId
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});//This lets you delete the object id that corresponds to that review from the campground.The $pull operator removes from an existing array all instances of a value or values that match a specified condition. This pulls the review with the review id from the url our of the reviews array of the campground with the id from the url. 
    await Review.findByIdAndDelete(reviewId); //This deletes the review with the url id from the reviews collections as well. 
    res.redirect(`/campgrounds/${id}`)//Sends you back to the campground page with the url id usgin a string template literal. 
}))

*/

app.all("*", (req, res, next) => { //app.all means this will activate for all route types eg .put and .get. The * means it will activate for all inputted urls. This will only run if nothing else runs first which is why it is last. 
    next(new ExpressError("Page not found.", 404))
});

app.use((error, req, res, next) => { //error in this case holds the value of the new ExpressError above.
    const { statusCode = 500 } = error //This const is destructured.
    if (!error.message) error.message = "Something went wrong!"
    res.status(statusCode).render("error.ejs", { error });//This is the error handling, this loads the error page and is triggered by something going wrong in any of the async functions above, it is triggered by catchAsync. When catchAsync passes to "next" it is activating this route, this is the "next" in that context. Err is the error that has occurred. 
})

app.listen(3000, function () {
    console.log('Server online on port 3000');
});
