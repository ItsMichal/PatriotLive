var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const util = require('util')

//Store Overall Data in big JSON thing
var importantteams = ["11-0735","11-0736","11-0738","11-0739","11-0740", "11-4576","11-4577"];
var json = {"teams":{}, "important":{}};

if(fs.existsSync("recover.json")){
  json = JSON.parse(fs.readFileSync('recover.json', 'utf8', err=>{
    if(err)
      throw err;
  }));
}else{
  console.log("Recovery file not found...");
}

scrape();
//Scrape CyperPatriot every 10 seconds, this is the live portion
//setInterval(scrape, 10000);


// function spinCycle(){
//   console.log("INFO - RUNNING SPIN CYCLE #"+(spin+1));
//   var team_id = importantteams[spin];
//   spin++;
//   var requrl = "http://scoreboard.uscyberpatriot.org/team.php?team="+team_id;
//   console.log(requrl);
//   request(requrl, function(err, resp, html){
//     if(!err){
//       var indx = html.indexOf("DataTable([");
//       var e_indx = html.indexOf("]);");
//       console.log(indx + ", " + e_indx);
//       indx+=10;
//       e_indx++;
//       e_indx-=indx;
//       var minijson = html.substr(indx, e_indx);
//       var testjson = JSON.parse(minijson);
//
//       console.log(minijson);
//
//     }else{
//       console.log("ERROR ON IMPORTANT TEAM REQUEST!");
//     }
//   });
// }

function scrapeHTML(x){
  var $ = cheerio.load(x);
  var doc = $.html();
  //console.log(doc);
  var table = $('.CSSTableGenerator');
  //console.log(table);
  var tbody = $(table).contents()[0];
  //console.log($(tbody).html());
  for(var i = 0; i < $(tbody).children().length; i++){
    //console.log(i+": "+$($(tbody).children()[i]).text());

  }
//  console.log($(tbody).contents().length);
  //$(tib)
  var rnkctr = [0,0,0,0]
  for(var i = 1; i < $(tbody).children().length; i++){
    var tdata = $(tbody).children()[i];
    var team_id = $($(tdata).children()[1]).text();
    //check if valid team

    //console.log(i+" team id : "+team_id);
    var team_state = $($(tdata).children()[2]).text();
    //console.log(i+" team state : "+team_state);
    var team_division = $($(tdata).children()[3]).text();

    var team_rank = 0;
    switch(team_division[0]){
      case "A":
        rnkctr[0]++;
        team_rank = rnkctr[0];
        break;
      case "C":
          rnkctr[1]++;
          team_rank = rnkctr[1];
          break;
      case "O":
          rnkctr[2]++;
          team_rank = rnkctr[2];
          break;
      case "M":
          rnkctr[3]++;
          team_rank = rnkctr[3];
          break;
      default:
          console.log("Invalid Ranking Team - "+team_id);
          break;
    }

    var team_tier = $($(tdata).children()[4]).text();
    var team_scored_images = $($(tdata).children()[5]).text();
    var team_play_time = $($(tdata).children()[6]).text();
    var team_warning = $($(tdata).children()[7]).text();
    var team_ccs_score = $($(tdata).children()[8]).text();
    var team_adjust = $($(tdata).children()[9]).text();
    var team_cisco_score = $($(tdata).children()[10]).text();
    var team_total_score = $($(tdata).children()[11]).text();
    var team_data = {
                    "rank":team_rank,
                    "state":team_state,
                    "division":team_division,
                    "tier":team_tier,
                    "scored_images":team_scored_images,
                    "play_time":team_play_time,
                    "warning":team_warning,
                    "ccs_score":team_ccs_score,
                    "adjust":team_adjust,
                    "cisco_score":team_cisco_score,
                    "total_score":team_total_score};
    json.teams[team_id] = team_data;

    //if we are looking at an important team...
    if(importantteams.indexOf(team_id) > -1){
      json.important[team_id] = team_data;



      //Get team historical data
    }
  }
  //console.log(util.inspect(json, {showHidden: false, depth: null}));
  //console.log(Object.keys(json.teams).length);

  var bckup = JSON.stringify(json);
  fs.writeFile("backup.json", bckup, 'utf8', err =>{if(err){throw err;}});
  console.log("[INFO] FINISHED SCRAPING");
  //util.inspect(json, {showHidden: false, depth: null})
  return json;
}

function scrape(){

  var url = "http://scoreboard.uscyberpatriot.org/";

  // scrapeHTML(url);//fs.readFileSync(url, "utf-8"));
  // pushUpdate();

  request(url, function(error, response, html){
    if(!error){
      //Store HTML
      scrapeHTML(html);
    }else{
      url = "cpccs.htm";
      scrapeHTML(fs.readFileSync(url, "utf-8"));
    }
  });
  pushUpdate();
}

io.on('connection', function(socket){
  console.log("someone connected");
  scrape();
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
