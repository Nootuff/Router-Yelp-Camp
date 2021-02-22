mapboxgl.accessToken = mapToken; //Takes the data held by this const on the details page which takes its data from.env. Don't know why this file couldn't just take that data directly form the env, apparently ejs just doesn't work that way. 
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location URL. You can apparently change this url to change up the style of the map. 
    center: campgroundLocation.geometry.coordinates, // starting position [long, lat], taken from the schema which was sent it's data by the geoData code in the createCampground route. campgroundLocation is a const in the details.ejs page at the bottom, it converts all the data in the particular campground being used on that page into an object containing only strings. This has to be done becasue center only accepts strings maybe. 
    zoom: 11 // starting zoom
});

new mapboxgl.Marker() //The code for the marker on the map. 
.setLngLat(campgroundLocation.geometry.coordinates) //All these things with . in front of them are apparently methods in the Marker object which is imported from mapbox.
.setPopup(
    new mapboxgl.Popup({ offset: 25 })
        .setHTML(
            `<h3>${campgroundLocation.title}</h3><p>${campgroundLocation.location}</p>`
        )
)
.addTo(map); //Its adding this marker to the const map up above