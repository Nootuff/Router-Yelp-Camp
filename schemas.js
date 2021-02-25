const BaseJoi = require('joi'); //Imports joi
const sanitizeHtml = require('sanitize-html'); //Imports sanitize-html, this package strips any html tags away from a user input, preventing hacking. 

const extension = (joi) => ({ //This is a function using sanitizeHtml up above to get rid of any html script a user might input intp a text input to hack the site. 
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [], //THis is where you but the html tags you are allowing users to enter into inputs, it is empty, nothing is allowed. 
                    allowedAttributes: {}, //This is the same, nothing is allowed, no fancy stuff. 
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension) //This tells the system to use joi with the extension security system above attached so it can be used by putting .escapeHTML() at the end of the lines bellow.

module.exports.campgroundSchema = Joi.object({ //This uses the Joi package that is required above. This Joi stuff is all about server side validation in case someone uses PostMan or AJAX or something to try and "hack" a new campground without using the site interface and create a campground without any data in the required fields. 
    campground: Joi.object({//This is an object becasue the form on the new.ejs page creates objects with properties such as "description" and "title". Other than this being an object, this matches the syntax on the main Joi docs page. All of these are jsut to make sure these pieces of info are present and completed on the form. 
        title: Joi.string().required().escapeHTML(), //With .escapeHTML() included, users cannot enter any html code here when they write out a campground title. 
        price: Joi.number().required().min(0),  //Price cannot be a negative. 
        location: Joi.string().required().escapeHTML(),
        //image: Joi.string().required(),
        description: Joi.string().required().escapeHTML()
    }).required(),
    deleteImages: Joi.array() 
});

module.exports.reviewSchema = Joi.object({ 
    review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    body: Joi.string().required().escapeHTML()
    }).required()
 });
 

