const cloudinary = require('cloudinary').v2; //THese 2 files require the 2 npms for uploading image files submitted thorugh Multer to cloudinary. 
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({ //The things in block capitals relate to the fields you put in your .env file, the names must match. 
    cloud_name: process.env.CLOUDINARY_ClOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

const storage = new CloudinaryStorage({ //This is an object, note the curly brackets.
    cloudinary, //passes in the config details above.
    params: {
    folder: "YelpCamp",    //This is the folder in cloudinary we will store things in
    allowedFormats: ["jpeg", "png", "jpg"] //These are the allowed file formats
    }
});

module.exports = { //Exports both of the above, making them avaialble in other files.  
    cloudinary,
    storage
    }