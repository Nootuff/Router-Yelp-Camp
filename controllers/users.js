const User = require("../models/user");

module.exports.renderRegister = function (req, res) {
    res.render("users/register.ejs");
}

module.exports.register = async (req, res) => { //This post route creates a user using the data from the registration form. 
    try {
        console.log(req.body);
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const newUser = new User({ username, email }); //Creates a new instance of user with this data.
        const registeredUser = await User.register(newUser, password); //the .register method is bought in by passport, it's not defined by you anywhere. Takes the new User we just made and takes their pass, it will hash the password and store the hashed password and thge salts in that new instance of User. As always, we awiat this because it takes time.
        console.log(registeredUser);
        req.login(registeredUser, error =>{ //This is another method from passport, logs in newly created user after registering. 
            if(error) return next(error); //If there's an error logging in the new user, go to the error handler, the error is passed to it I think, 
            })
        req.flash("success", "Welcome to YelpCamp!");
        res.redirect("/campgrounds");
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("register")
    }
}

module.exports.renderLogin = function (req, res) {
    res.render("users/login.ejs");
}

module.exports.login = (req, res) => { //.authenticate is one of the methods bought in from passport. failureFlash isn't anything you've defined, its a built in flash message that will display if there is a problem, failureRedirect will then take you back to the login page. Seems to be some kind of error handling. "local" isn't standard it seems. "local" means that you're using the normal approach, with basic username + password authentication, stored in that application database. Other approaches are using social media log in, like Facebook/Twitter, etc, among many others.
    req.flash("success", "Welcome back!");
    const redirectUrl = req.session.returnTo || "/campgrounds"; //When user logs in, either redirect them to the page held in returnTo as defined in middleware.js OR redirect them to /campgrounds. 
	delete req.session.returnTo; //We don't need the returnTo in the session after the redirect so delete just deletes it from the object, otherwise all these returnTo's would clutter up the object.
    res.redirect(redirectUrl);
 }

 module.exports.logout = function(req, res){
    req.logout(); //.logout() is another route bought in from password, logs the user out.
    req.flash("success", "Goodbye!");
    res.redirect("/campgrounds");
    }