mapboxgl.accessToken = mapToken; //Takes the data held by this const on the details page which takes its data from.env. Don't know why this file couldn't just take that data directly form the env, apparently ejs just doesn't work that way. 
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location URL
    center: [-74.5, 40], // starting position [long, lat]
    zoom: 9 // starting zoom
});