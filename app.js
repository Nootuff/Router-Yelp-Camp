if (process.env.NODE_ENV !== "production") { //This checks to see what mode the app is in, if it's NOT in production mode, we have access to all the keys in the .env file that make mapbox and cloudinary work. If we're in production mode, that file will not be required and none of the stuff inside will be available.
    require("dotenv").config()
}

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
const mongoSanitize = require('express-mongo-sanitize'); //IMports a security program to deal with injection attacks. 
const helmet = require('helmet'); 
const MongoStore = require('connect-mongo').default;//Imports connect-mongo. This package lets us store session data. 

const userRoutes = require("./routes/users");
const campgroundRoutes = require('./routes/campgrounds');//Imports the campgrounds routes, this is to do with router.
const reviewRoutes = require('./routes/reviews');

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/test'; // This imports DB_URL from your .env file. This contains the url from mongoDB atlas in the database access setion, the url contains the password for yelpCamp_User. OR it can be your local storage database. 

//'mongodb://localhost:27017/test'
mongoose.connect(dbUrl, { //This is all part of the mongoose setup. Apparently "test" is the name of the Database everything is being uploaded to, the reviews and the campgrounds also a bunch of movies from your MongooseTest app. This could create a problem later because you copied the origional to create this new version when colt switched to Router. 
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

const secret = process.env.SECRET || "bigSecret";

const store = MongoStore.create({ //This creates a mongo store to store session data. 
    mongoUrl: dbUrl,
    secret: secret, //the secret property is set to const secret which can be one of 2 things. 
    touchAfter: 24 * 60 * 60    //Explanation for this option on the docs, limits the number of times a session is saved so it's not saving constantly. The numbers are an hour in seconds I think, session saved every hour. 
    });

    store.on("error", function(error){
        console.log("Session Store error!", error)
        });
        

const sessionConfig = {
    store: store, //THis passes in the mongo store up above and makes it available. The "store" property here is set to const store up above.
    name: "sessionName", //This names the session
    secret: secret, //value of secret set to const secret.
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, //This thing is optional, if its included, the cookie cannot be accessed through or interfered with by a client side script. This is extra security. Hackers cannot see confidential cookies, you should have it. 
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //This is when the cookie is programmed to expire. It is todays date, Date.now is in milliseconds. We want this cookie to expire in a week so the sum is 1000 milliseconds in a second, 60 secs in a minute, 60 mins in an hour, 24 hours etc. So the date it will expire is today's date plus that time.
        maxAge: 1000 * 60 * 60 * 24 * 7
        //All this expiration stuff is because we don't want users to log in and stay logged in, they will get logged out after a week? 
    }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [ //The next 4 consts are to do with Helmet. These arrays contain lists of software that the website allows to run on it. such as bootstrap and fontawesome if you want it. Without these lists of things the website is allowing, the maps wouldn't work and neither would the cloudinary upload nor anything like that. These lists can be modified to include or exclude some things. This is security so hackers can't add malicious scripts to your site. If you add in a new font or a new script from somewhere else you will need to add it in to this list. 
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [ //This is where you specify where images can be sourced from, "self" means images stored in the actual folders of the project. 
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dfj7xeo4n/", //SHOULD MATCH YOUR CLOUDINARY Cloud name on your ACCOUNT! This line allows images to come from your cloudinary hosting. 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

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
app.use(mongoSanitize()); //Activates mongoSanitize which prevents hackers using code injection attacks on your site, security software. 

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
