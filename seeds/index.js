const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', {
useNewUrlParser: true, 
useUnifiedTopology: true,
useCreateIndex: true
});


const db = mongoose.connection; //No idea what this code does, seems to just put messages in console log
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
});

const Campground = require("../models/campground") //imports the schema template from campground.js in the models folder.
const {places, descriptors} = require("./seedHelpers");
const Cities = require("./cities") //imports the array from  cities.js, that array is being exported, this imports it.

//This file, when run using node, will populate the campgrounds collection with 50 campgrounds and delete the ones already in there. 

const sample = array => array[Math.floor(Math.random() *array.length)]; //This is some kind of randomizer to be used with the stuff in seedhelpers.js

const seedDB = async() => {
await Campground.deleteMany({}); //I think this will delete everything already in the Campground collection so that new objects generated below can be added in . This function clears out the database of everything in it, ({}) means everything. This activates each time node index.js is run.
    for (let i = 0; i< 50; i++){ //This will generate 50 cities with locations and randomized titles.
        const random18 = Math.floor(Math.random() * 18)  //There are 18 city objects in the array in cities.js, this gens a new number between 0 and 18 I think.
        const costOfStaying = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({ //Creates a new object for campgrounds, using Campground schema does this 50 times. 
        location: `${Cities[random18].city}, ${Cities[random18].state}`,
        title: `${sample(descriptors)} ${sample(places)}`, //picks random values from descriptors & places & puts them together to make a title.
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        price: costOfStaying,
        image: "https://source.unsplash.com/collection/2184453" 
        })
        await camp.save();
        }
        
    }

    seedDB().then(()=> {
        mongoose.connection.close();
        })