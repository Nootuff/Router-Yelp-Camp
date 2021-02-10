module.exports.isLoggedIn = (req, res, next) => { //All middleware have req, res and next. The module.exports is exporting this meaning it an be used in other files.
    console.log(req.user);
    if (!req.isAuthenticated()) { //isAuthenticated is a method bought in by passport. It detects if the currect user is logged in (Authenticated)
        console.log(req.originalUrl);
        req.session.returnTo = req.originalUrl //originalUrl holds the URL they are requesting/page they want to go to when they hit the login screen maybe? returnTo will be the url we redirect the user back to. I think putting req.session before it adds the data of what they were trying to access to their session cookies.
        req.flash("Error", "You must be signed in to do this.");
        return res.redirect("/login"); //These things activate if the user does not read as logged in. Always have a return on a redirect in an if statement. 
    }
    next();
}
