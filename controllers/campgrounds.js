

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({}) //Find everything in campgrounds collection. This const holds them all. Becasue of await, render doesn't occur until campgrounds has gathered all data. 
    res.render("campgrounds/index.ejs", { campgrounds }); //pass them to the ejs document
}