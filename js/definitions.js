"use strict";

let articles = [];
let articleNames = [];
let articleNamesNormalised = [];
let articleNamesLowercase = [];
let articleNamesSorted = [];
let viewCounts = [];
let viewCountsCommas = [];
let dataURL = "";
let viewsURL = "";
let descURL = "";
let summaries = ["","","","","","","","","",""];
let images = ["","","","","","","","","",""];
let emoji = ["😱","😭","😬","🥱","🙃","😤","🤤","😎","🤩","🤯"];
let topTen = [];
let correctArray = [0,1,2,3,4,5,6,7,8,9];
let alreadyAnswered = [];
let lives = 3;
let points = 0;
let timerInput = "";
let incorectWords = ["Incorrect!","Wrong!","Nope!","Eh-er!","No!","No Sir!","Don't think so!","Pfft, nope!","Ah, so close!","Unlucky!","Ouch!","Noooo!","Oops!","Dang!","Cripes!","Can you believe it?!"];
let correctWords = ["Awesome!","Correct!","Well done!","Nice one!","That's it!","Heck yeah!"];
const ALERT_DURATION = 500;
const TIMER_INTERVAL = null;

// We need to filter out some popular pages, since they'll appear disproportionately often: https://en.wikipedia.org/wiki/Wikipedia:Popular_pages
const badTitles = [
 "Main_Page",
 "Special:Search",
 "Portal:Current_events",
 "Wikipedia:Featured_pictures",
 "2023",
 "Wikipedia",
 "XHamster",
 "HTTP cookie",
 "JSON Web Token",
 "Cookie (disambiguation)",
 "Access token",
 "Web scraping",
 "XXX",
 "Web performance",
 "Bible",
 "Cleopatra",
 "Undefined",
 "Search",
 "Creative Commons Attribution",
 "-",
 "Wiki"
]

const badTitlesRegex = /(Special:|Wikipedia:|File:|Help:|User:|Deaths_in|.php|List_of|disambiguation|Category:)/gi;

const MAX_GUESS_LIST_OPTIONS = 10

const NEW_GAME_TEXT = "New"
const GIVE_UP_TEXT  = "Resign"

const NEW_GAME_CLASS = "new-game-box"
const GIVE_UP_CLASS  = "give-up-box"

var GAME_OVER = false