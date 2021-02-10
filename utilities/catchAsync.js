module.exports = func => { //This is a function thats accepts a function (func) as its argument then passes that function 
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}

//This is what does the asynchronous function error handling. The .catch(next) is what allows the programme to keep running even when an error occurs. 