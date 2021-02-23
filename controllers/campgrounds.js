const Campground = require("../models/campground"); //imports the Mongoose schema template from campground.js in the models folder.
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding'); //imports Mapbox stuff from the Mapbox npm package. Apparently geocoding is only one of the systems you can download, there are many others.
const mapBoxToken = process.env.MAPBOX_TOKEN; //imports mapbox token from the .env file, the token itself comes from your mapbox account. 
const geocoder = mbxGeocoding({ accessToken: mapBoxToken }) //sets up your mapbox integration with your token and assigns this set-up, functional instance of Mapbox to this const? 
const { cloudinary } = require("../cloudinary"); //imports cloudinary from the index.js

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({}) //Find everything in campgrounds collection. This const holds them all. Becasue of await, render doesn't occur until campgrounds has gathered all data. 
    //const campgrounds = await Campground.find({}).populate('popupText');
    res.render("campgrounds/index.ejs", { campgrounds }); //pass them to the ejs document
}

module.exports.renderNewForm = function (req, res) { //isLoggedIn is the the middlewar function, detects whether a user has logged in otherwise they cannot view this route. Note no async, no mongoose / db stuff here, no need for it, no data being reqeusted.
    res.render("campgrounds/new.ejs");
}

module.exports.createCampground = async (req, res, next) => {//catchAsync is the function being imported above for the js file with the same name, it is the async error handling in this function. You need the isLoggedIn middleware here to make sure no one can use Postman or Ajax or something ot access this post route when they are not loggedin, it's protection.
const geoData = await geocoder.forwardGeocode({ //forwardGeocode is a method imported from mapbox, needs a set up instance of mapbox, like the one held in const geocoder to use. 
    query: req.body.campground.location, //Takes the entered location of the campground. 
    limit: 1 //We only want one result.
}).send()
    const campground = new Campground(req.body.campground); //No idea what req.body.campground actually is or what "campground" refers to here, possibly the object that is created in new.ejs using the data inputted by the user into that form. 
    campground.geometry = geoData.body.features[0].geometry; //Features is an array that is sent back by mapbox using const geoData above, we want the first item in that array then the geometry.coordinates property of that first item, this is then set as the geometry value of this new instance of campground somehow, the data just slots into coordinates somehow.  
    campground.images = req.files.map(file => ({ url: file.path, filename: file.filename })) //This syntax is called implicit Returns. All the values like path come from Multer parsing the image I think, "file" is just a placeholder, can be anything. The way this function works, if you uploaded 2 files, they would be placed in an array by upload.array and added to "request.files" which can be accessed with req.files & is shown in the console.log above. Map() is then used to go over that array and assign path and filename to the images object of the new campground object you just created I think under the url and filename values.
    campground.author = req.user._id; //req.user is automatically added in, they have to be logged in to even reach this create campground page, the user details are taken from that somehow. The author value of this campground is set to the user._id of the user who made this post request.
    console.log("Campground here", campground)
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
    const imgs = req.files.map(file => ({ url: file.path, filename: file.filename }));//JUst like the create campground route above, this time, we are editing an existing campground not overwriting empty values with images as with the create route so we are pushing any uploaded files to an existing array of image files.
    campground.images.push(...imgs);  //Three dots, spread operator, no idea. Somehow the data is being extracted from the uploaded images array, assigned to imgs and then pushed in the campround.images array. 
    await campground.save();
    if (req.body.deleteImages) { //If there are actually images present in that deleteImages array ie. if someone has selected some images on the edit page. 
        for (let filename of req.body.deleteImages) { //Loop over all images added to the deleteImages array, this would probably work with a for loop too.
            await cloudinary.uploader.destroy(filename); //This code is from cloudinary, uploader.destroy is a method you imported, it deletes each image from the yelpcamp folder on your account by targeting its filename. They are actually deleted from your account on the website itself. 
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })  //$pull operator apparently pulls elements out of an array. This code pulls from the images array of the campground you found & assigned to const campground up above, all images where the filename of that image is $in the req.body. deleteImages array which you can see in edit.ejs. Ticking that checkbox adds them to the array and then this code takes them out of the campground images array.
        console.log(campground);
    }
    req.flash("success", "You've successfully updated this campground!");
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res) => {
    const idHolder = req.params.id;
    await Campground.findByIdAndDelete(idHolder);
    req.flash("success", "Campground deleted.")
    res.redirect("/campgrounds");
}