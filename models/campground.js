const mongoose = require('mongoose');
const Review = require('./review'); //Imports the review schema so it can be used below. 
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
  url: String,
  filename: String
});

ImageSchema.virtual("thumbnail").get(function(){ //"thumbnail" is a placeholder, it can be called anything. The virtual method, not sure what it is, I think it means the modified image isn't being stored anywhere in our database, the transformed image isn't being stored anywhere, the image is just being modified each time it is called through the .replace below. Thumbnail also seems to be soemthing you can call on your pages 
return this.url.replace("/upload", "/upload/w_200"); //"this" refers to the particular image. This code takes each images url and runs it through this replace method that adds in the w_200, more on this is detailed at the bottom of your mongo db basics notes. It's to do with Cloudinary's transformation system, adding in a little code can modify the image as its sent from the site. 
});

const opts = { toJSON: { virtuals: true } };
 //Converts virtuals to json? This is something to do with clicking on the index map's unclustered points and getting a popup.

const campgroundSchema = new mongoose.Schema({ //Your schema, these are the only properties you can have in your database.
  title: String,
  price: Number,
  description: String,
  location: String,
  images: [ImageSchema], //This is the schema above nested within this one. 
  geometry:{ //This stores the geocoder data sent from mapbox.
    type:{
    type: String, 
    enum: ["Point"], //The enum keyword is used to restrict a value to a fixed set of values. It must be an array with at least one element, where each element is unique. When storing location data, the enum must be set to just  "Point", look up Using GeoJSON in the mongoose docs if you want to know more. 
    required: true
    },
    coordinates: {
    type: [Number], //The brackets mean its an array of that datatype, coordinates is an array of numbers.
    required: true
    }
    },
  author: {
type: Schema.Types.ObjectId,
ref: "User" //Takes an objectID from the User model just like Review below, allowing this schema to access users, .populate("author") is used in the /:id route in the campgrounds .js page to allow all the user data to be used on the campgrounds details page. Takes the "User" ref from the module.exports section of the parent schema. 
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review" //reviews takes an ObjectId from the Review model, the campground can have a review stored in its database as an object. 
    }
  ],
}, opts); //Includes the code from the opts const above. 

campgroundSchema.virtual("properties.popUpMarkup").get(function(){ //I have no idea what this is, something to do with the index.js map, when you click on one of the red points you get the popup, this is the code for the interior text for that. popUpMarkup is our name and it's being saved to something called "properties" which mapbox needs to access this I think. Not sure where properties is.
  return `<i><a href="/campgrounds/${this._id}">${this.title}</a></i>` //This refers to this particular campground instance/
  });  

campgroundSchema.post("findOneAndDelete", async function (item) { //This is a post middleware, runs after something? It has access to the campground (item) that that was just deleted, as, in the process of deleting, the campground is passed to this middleware. This middleware will only work when a campground is removed by findOneAndDelete like it is in the campground delete route in the campgrounds routes page. If the campground was being removed by some other means this middleware wouldn't work. The delete methods have to match maybe? 
  console.log(item)
  if (item) {//If something was actually found and deleted to begin with and the whole operation ran.
    await Review.deleteMany({
      _id: {
        $in: item.reviews    //The $in operator selects the documents where the value of a field equals any value in the specified array.
      }
    })
  }
})

module.exports = mongoose.model("Campground", campgroundSchema); //carrying the data of campgroundSchema to new documents with the variable name of "Campground"