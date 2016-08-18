//adding npm modules and setting program-wide variables
var express = require("express");
var request = require("request");
var json = require("json");
var mongo = require('mongodb').MongoClient;
var app=express();
var imgurClientID = "96eb18eadc6b134";
var imgurClientSecret = "246c6b2d1fd8533d8c6a841e2044aba86428ea13";

app.get('/imagesearch/search/:searchstring', function(req,res){

  //getting offset parameter from URL
  offsetString = "";
  if (parseInt(req.query.offset)>0){
    offsetString = parseInt(req.query.offset);
  }

  //making the request to imgur API
  request({
  url: 'https://api.imgur.com/3/gallery/search/top/'+offsetString+'?q='+req.params.searchstring,
  method: 'GET',
  headers: {
    Authorization: 'Client-ID ' + imgurClientID,
    Accept: 'application/json'
  }
}, 
  //processing what the API returned: print to the user
 function(error, response, body){
    if (JSON.parse(body).data.length > 0){
        myresponse = JSON.parse(body).data.slice(0,JSON.parse(body).data.length);
        yourresponse = [];
        for (i=0; i<JSON.parse(body).data.length; i++){
            if (myresponse[i].hasOwnProperty("cover"))
                { coverid = myresponse[i].cover; }
            else coverid = myresponse[i].id;
            yourresponse.push({url:"http://i.imgur.com/"+coverid+".jpg", 
                               thumbnail:"http://i.imgur.com/"+coverid+"m.jpg", 
                               album: "http://imgur.com/gallery/"+myresponse[i].id,
                               alttext: myresponse[i].title
                           });
        }
        res.json(yourresponse)
    }
    else res.end("Could not complete the search. Try another term or a different offset.")
});
  //add the search string to the database
  //prepare the database
    mongo.connect("mongodb://dickorydock:$iderHouseRul3z@ds145365.mlab.com:45365/urlrosetta", function(err, db) {
        var imagesearch = db.collection("imagesearch");
        var newsearchstring={search_term: req.params.searchstring, search_time: new Date()};
        imagesearch.insert(newsearchstring);
        db.close()
    })
})

/*adding a method for people who want to see all the previous searches*/
app.get('/imagesearch/latest/', function(req,res){
 mongo.connect("mongodb://dickorydock:$iderHouseRul3z@ds145365.mlab.com:45365/urlrosetta", function(err, db) {
    var imagesearch = db.collection("imagesearch");
    imagesearch.find({},{_id: 0, search_term: 1, search_time: 1}).sort({search_time:-1}).toArray(function(err, documents){
        res.end(JSON.stringify(documents.slice(0,10)));
    });
    db.close()
    })
});

app.listen(8080, function(){
//app.listen(process.env.PORT, function(){
    console.log("App listening")
});

