var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const util = require('util')

//Store Overall Data in big JSON thing
var json = {"teams":{}};

scrape();
//Scrape CyperPatriot every 10 seconds, this is the live portion
setInterval(scrape, 10000);

function scrapeHTML(x){
  var $ = cheerio.load(x);
  var doc = $.html();
  var table = $('.CSSTableGenerator');
  //console.log(table);
  var tbody = $(table).contents()[0];
  //console.log($(tbody).html());
  for(var i = 0; i < $(tbody).children().length; i++){
    //console.log(i+": "+$($(tbody).children()[i]).text());

  }
//  console.log($(tbody).contents().length);
  //$(tib)
  for(var i = 1; i < $(tbody).children().length; i++){
    var tdata = $(tbody).children()[i];
    var team_id = $($(tdata).children()[0]).text();
    //console.log(i+" team id : "+team_id);
    var team_state = $($(tdata).children()[1]).text();
    //console.log(i+" team state : "+team_state);
    var team_division = $($(tdata).children()[2]).text();
    var team_tier = $($(tdata).children()[3]).text();
    var team_scored_images = $($(tdata).children()[4]).text();
    var team_play_time = $($(tdata).children()[5]).text();
    var team_score_time = $($(tdata).children()[6]).text();
    var team_current_score = $($(tdata).children()[7]).text();
    var team_warning = $($(tdata).children()[8]).text();
    var team_data = {"team_state":team_state, "team_division":team_division, "team_tier":team_tier, "team_scored_images":team_scored_images, "team_play_time":team_play_time, "team_score_time":team_score_time, "team_current_score":team_current_score, "team_warning":team_warning};
    json.teams[team_id] = team_data;
  }
  console.log(util.inspect(json, {showHidden: false, depth: null}));
  //util.inspect(json, {showHidden: false, depth: null})
  return json;
}

function scrape(){
  var url = "cpccs.htm";
  scrapeHTML(fs.readFileSync(url, "utf-8"));
  pushUpdate();

  // request(url, function(error, response, html){
  //   if(!error){
  //     //Store HTML
  //     var $ = cheerio.load(html);
  //     console.log(util.inspect(response, {showHidden: false, depth: null}));
  //     console.log("\nhello\n");
  //     console.log(util.inspect($, {showHidden: false, depth: null}));
      //Parse HTML;
      // var table;//$.getElementsByClassName("CSSTableGenerator")[0];
      // $('.CSSTableGenerator').filter(function(){
      //   table = $(this);
      //   console.log(this);
      // });
      // var tbody = table.childNodes[0];
      // for(var i = 1; i < tbody.childNodes.length; i++){
      //   var tdata = tbody.childNodes;
      //   var team_id = tdata[0].innerHTML;
      //   var team_state = tdata[1].innerHTML;
      //   var team_division = tdata[2].innerHTML;
      //   var team_tier = tdata[3].innerHTML;
      //   var team_scored_images = tdata[4].innerHTML;
      //   var team_play_time = tdata[5].innerHTML;
      //   var team_score_time = tdata[6].innerHTML;
      //   var team_current_score = tdata[7].innerHTML;
      //   var team_warning = tdata[8].childNodes[0].innerHTML;
      //
      //   var team_data = {"team_state":team_state, "team_division":team_division, "team_tier":team_tier, "team_scored_images":team_scored_images, "team_play_time":team_play_time, "team_score_time":team_score_time, "team_current_score":team_current_score, "team_warning":team_warning};
      //   json += {team_id:team_data};
      // }
      // console.log(json);
    // }
  // });
}

io.on('connection', function(socket){
  console.log("someone connected");

});

function pushUpdate(){
  io.emit('data-updated', json);
}

app.get('/', function(req, res){
  res.sendFile((__dirname +'/app.html'));
});

server.listen(3000, function(){
  console.log("now listening");
});
