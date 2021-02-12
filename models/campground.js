const mongoose = require('mongoose');
const Review = require('./review'); //Imports the review schema so it can be used below. 
const Schema = mongoose.Schema;

const campgroundSchema = new mongoose.Schema({ //Your schema, these are the only properties you can have in your database.
  title: String,
  price: Number,
  description: String,
  location: String,
  image: String,
  author: {
type: Schema.Types.ObjectId,
ref: "User"
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review" //reviews takes an ObjectId from the Review model, the campground can have a review stored in its database as an object. 
    }
  ]
});

campgroundSchema.post("findOneAndDelete", async function (item) { //This is a post middleware, runs after something? It has access to the campground (item) that that was just deleted, as, in the process of deleting, the campground is passed to this middleware. This middleware will only work when a campgrond is removed by findOneAndDelete like it is the app.delete route in app.js. If the campground was being removed by some other means this middleware wouldn't work. The delete methods have to match maybe? 
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