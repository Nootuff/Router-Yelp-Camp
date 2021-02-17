const Campground = require("../models/campground"); //imports the Mongoose schema template from campground.js in the models folder.

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({}) //Find everything in campgrounds collection. This const holds them all. Becasue of await, render doesn't occur until campgrounds has gathered all data. 
    res.render("campgrounds/index.ejs", { campgrounds }); //pass them to the ejs document
}

module.exports.renderNewForm  =  function (req, res) { //isLoggedIn is the the middlewar function, detects whether a user has logged in otherwise they cannot view this route. Note no async, no mongoose / db stuff here, no need for it, no data being reqeusted.
    res.render("campgrounds/new.ejs");
}

module.exports.createCampground = async (req, res, next) => {//catchAsync is the function being imported above for the js file with the same name, it is the async error handling in this function. You need the isLoggedIn middleware here to make sure no one can use Postman or Ajax or something ot access this post route when they are not loggedin, it's protection.
    console.log(req.body.campground);
    const campground = new Campground(req.body.campground); //No idea what req.body.campground actually is or what "campground" refers to, possibly the object that is created in new.ejs in that form, from the data that is inputted. 
    campground.author = req.user._id; //req.user is automatically added in, they have to be logged in to even reach this create campground page, the user details are taken from that somehow. The author value of this campground is set to the user._id of the user who made this post request.
    await campground.save(); //The await means the .save() has to happen before the redirect can run.
    req.flash("success", "You've created a new campground!"); //Triggers the flash message before the redirect after you create a campground. 
    res.redirect(`/campgrounds/${campground._id}`); //String template literal, note the backticks. Maybe you have to use string template literals for these page addresses? Passing a variable in never seems to work. 
}

module.exports.showCampground = async (req, res) => { //Note that this has to be a lower  get route on the page or the system will interpret anything anything entered into the url after campgrounds/ as the :id you are attempting to search for eg. system will attempt to search for something with the the id of "new" instead of loading the "new" route. This must be lower as the system goes vertically down the page, the system will look at everything above it first. 
    const campground = await Campground.findById(req.params.id).populate({ 
        path: "reviews", //The curly brackets show this is an object. On the campground we have found, populate it with it's reviews.
        populate: { //Then populate each review with that review's author.
            path: "author"
        }
    }).populate("author"); //The ID is taken from the url I think. The id is taken from the url and fed into .findById() which is a mongoose method which scans the Campground schema. The .populates are unpacking data stored as objectIds in the campground schema that are actually data from other schemas / databases namely reviews and users and making it available on the campground details page. This line populates the campground with its author. 
    console.log(campground);
    if (!campground) { //If mongoose didn't find a campground with that id, flash error then redirect
        req.flash("error", "Sorry that campground does not exist.");
        return res.redirect("/campgrounds") //No idea why return is needed here.
    }
    res.render("campgrounds/details.ejs", { campground });
}

module.exports.renderEditForm = async (req, res) => { //isLoggedIn & isAuthor are both middleware that will run before the rest of this route runs. isAuthor prevents you from even accessing the edit route when logged in with a different user. 
    const campground = await Campground.findById(req.params.id);
    if (!campground) { //If mongoose didn't find a campground with that id for user to edit, flash error then redirect
        req.flash("error", "Sorry that campground does not exist.");
        return res.redirect("/campgrounds") //No idea why return is needed here but you always have one on a redirect in an if statment. 
    }
    res.render("campgrounds/edit.ejs", { campground }); //pass them to the ejs document
}

module.exports.updateCampground = async (req, res) => {
    const idHolder = req.params.id; //Holds the current campground id taken from the URL?
    const campground = await Campground.findByIdAndUpdate(idHolder, { ...req.body.campground }) //The 3 dots are the spread operator this somehow allows you to use the values contained within the square brackets on the name values in the forms on the new and edit.ejs pages. 
    req.flash("success", "You've successfully updated this campground!");
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res) => {
    const idHolder = req.params.id;
    await Campground.findByIdAndDelete(idHolder);
    req.flash("success", "Campground deleted.")
    res.redirect("/campgrounds");
}