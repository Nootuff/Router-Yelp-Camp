const Joi = require('joi'); //This is used for error handling this 

module.exports.campgroundSchema = Joi.object({ //This uses the Joi package that is required above. This Joi stuff is all about server side validation in case someone uses PostMan or AJAX or something to try and "hack" a new campground without using the site interface and create a campground without any data in the required fields. 
    campground: Joi.object({//This is an object becasue the form on the new.ejs page creates objects with properties such as "description" and "title". Other than this being an object, this matches the syntax on the main Joi docs page. All of these are jsut to make sure these pieces of info are present and completed on the form. 
        title: Joi.string().required(),
        price: Joi.number().required().min(0),  //Price cannot be a negative. 
        location: Joi.string().required(),
        //image: Joi.string().required(),
        description: Joi.string().required()
    }).required(),
    deleteImages: Joi.array() 
});

module.exports.reviewSchema = Joi.object({ 
    review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required()
    }).required()
 });
 

