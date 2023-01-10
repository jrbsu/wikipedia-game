"use strict";
let articles = [],
	articleNames = [],
	articleNamesNormalised = [],
	viewCounts = [],
	viewCountsCommas = [],
	dataURL = "",
	viewsURL = "",
	descURL = "",
	summaries = ["","","","","","","","","",""],
	images = ["","","","","","","","","",""],
	emoji = ["😱","😭","😬","🥱","🙃","😤","🤤","😎","🤩","🤯"],
	topTen = [],
    correctArray = [0,1,2,3,4,5,6,7,8,9],
    lives = 3,
    incorectWords = ["Incorrect!","Wrong!","Nope!","Eh-er!","No!","No Sir!","Don't think so!","Pfft, nope!","Ah, so close!","Unlucky!","Ouch!","Noooo!","Oops!","Dang!","Cripes!","Can you believe it?!"];

function getDate() {
	let d = new Date(),
		month = d.getMonth()+1,
		day = d.getDate()-1,
		output = d.getFullYear() + '/' + (month<10 ? '0' : '') + month + '/' + (day<10 ? '0' : '') + day,
		intl = new Intl.DateTimeFormat("en-US", {month: "long"}).format(month),
		titleOutput = day + " " + intl + " " + d.getFullYear();
	dataURL = "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia.org/all-access/" + output;
	$('#title').html("Wikipedia guessing game:<br/>" + titleOutput);
}

function randomDate() {
    let ys = [2016,2017,2018,2019,2020,2021,2022],
        y = ys[Math.floor(Math.random() * ys.length)],
        m = Math.floor(Math.random() * 12) + 1,
        d = Math.floor(Math.random() * 30) + 1,
        output = y + '/' + (m<10 ? '0' : '') + m + '/' + (d<10 ? '0' : '') + d,
        dateObject = new Date(output),
        intlMonth = dateObject.toLocaleString("default", {month: "long"}),
        titleOutput = d + " " + intlMonth + " " + y;
    //output = "2017/04/28"; // testing
    //output = "2019/02/12"; // testing
	dataURL = "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia.org/all-access/" + output;
	$('#title').html("Wikipedia guessing game:<br/>" + titleOutput);
}

function getData(a) {
    $('#guess').focus();
	return new Promise((resolve, reject) => {
		$.ajax({
			url: a,
			type: 'GET',
			success: function(data) {
				resolve(data)
			},
			error: function(error) {
				reject(error)
			},
		});
	});
}

function getSummaries() {
	return new Promise((resolve, reject) => {
		$.ajax({
			url: descURL,
			type: 'GET',
			success: function(data) {
				resolve(data)
			},
			error: function(error) {
				reject(error)
			},
		});
	});
}

function userSubmit() {
    let guess = $('#guess').val();
	let index = topTen.indexOf(guess);
	if (index !== null && index !== -1) { // user is correct
		let correctAnswer = ".answer:eq(" + index + ")";
		$(correctAnswer + " .answer-text").html('<strong><a href="https://en.wikipedia.org/wiki/' + articleNames[index] + '">' + guess + '</a></strong>');
        $(correctAnswer).css('background-color', 'var(--green)');
        $(correctAnswer).css('background-image', 'url(' + images[index] + ')');
        if (correctArray.indexOf(index) > -1) {
            correctArray.splice(correctArray.indexOf(index), 1);
        }
        $('#guess').val("");
        $('#guess').focus();
        //$('#correct').show().delay(1000).fadeOut();
		if (correctArray.length == 0) {
			gameOver();			
		}
	} else if (index == -1) { // user is incorrect
        lives -= 1;
        $("i:eq(" + lives + ")").removeClass("fa-solid");
        $("i:eq(" + lives + ")").addClass("fa-regular");
        $('#guess').val("");
        $('#guess').focus();
        let randomStatement = incorectWords[Math.floor(Math.random() * incorectWords.length)];
        $('#incorrect h1').html(randomStatement);
        $('#incorrect').show().delay(1000).fadeOut();
    }
    if (lives == 0) {
        gameOver();
    }
}

function gameOver() {
    $('#guess').attr('disabled','disabled');
    for (var i=0;i<correctArray.length;i++) {
        let unanswered = ".answer:eq(" + correctArray[i] + ")";
        $(unanswered).css('background-color', 'var(--red)');
        $(unanswered).css('background-image', 'url(' + images[correctArray[i]] + ')');
        $(unanswered + " .answer-text").html('<strong><a href="https://en.wikipedia.org/wiki/' + articleNames[correctArray[i]] + '">' + articleNamesNormalised[correctArray[i]] + '</a></strong>');
    }
    let points = 10 - correctArray.length;
    $('#points').html(points);
    $('#emoji').html(emoji[points]);
    $('#game-over').removeClass('hidden');
}

$("#guess").on('keyup', function (e) {
    if ((e.key === 'Enter' || e.keyCode === 13) && $("#guess").val().length !== 0) {
        userSubmit();
    }
});

$("#help").click(function(){
    $("#help-alert").removeClass("hidden");
});

$("#help-alert").click(function(){
    $("#help-alert").addClass("hidden");
});

$('#game-over').click(function() {
    $('#game-over').fadeOut();
});

function censor(a) {
	let w = a.split(" ");
	let res = w.map(b => "<span class='word'>" + b.slice(0,1) + b.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]/ug,"_&nbsp;").replace(/^./,"").replace(/$/,"</span>"));
	return res.join("");
}

$(document).ready(function () {
	getDate();
    // randomDate(); //testing
	getData(dataURL).then((data) => {
		articles = data.items[0].articles;
		let badTitles = ["Main_Page","Special:Search","Portal:Current_events","Wikipedia:Featured_pictures","2023","Deaths in 2023","Wikipedia","XHamster","HTTP cookie","JSON Web Token","Cookie (disambiguation)","Access token","Web scraping","XXX","Web performance","Bible","Cleopatra","Undefined","Search","Creative Commons Attribution"],
            badTitlesRegex = /(Special:|Wikipedia:|File:|Help:|User:|Deaths_in|.php|List_of|disambiguation|Category:)/gi;
		for (var i=0;i<articles.length;i++) {
			if(jQuery.inArray(articles[i].article, badTitles) == -1 && articles[i].article.match(badTitlesRegex) == null) {
				articleNames.push(articles[i].article.replace(/\"/g,"\""));
				articleNamesNormalised.push(articles[i].article.replace(/_/g," "));
				let pv = articles[i].views;
				viewCounts.push(articles[i].views);
				viewCountsCommas.push(articles[i].views.toLocaleString());
			}
		}
		let articleNamesSorted = [...articleNamesNormalised];
		
		let titleString = "";
		for(var i=0;i<10;i++) {
			titleString += articleNames[i] + "%7C";
		}
		titleString = titleString.slice(0, -3);
		descURL = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=description%7Cpageimages&titles=" + titleString + "&redirects=1&formatversion=2&piprop=thumbnail&pithumbsize=800&pilicense=any";

		getSummaries().then((data) => {
			let summariesData = data.query.pages,
                redirectList = data.query.redirects;
            if (redirectList !== undefined) {
                for(var i=0;i<redirectList.length;i++) { // identify any redirects
                    let redirFrom = redirectList[i].from,
                        redirTo = redirectList[i].to,
                        a = articleNamesNormalised.indexOf(redirFrom);
                    if (a > -1) {
                        articleNamesNormalised[a] = redirTo;
                        articleNamesSorted.push(redirTo);
                    }
                }
            }
            
            articleNamesSorted.sort();
		
            for (var i=0;i<articleNamesSorted.length;i++) {
                let option = `<option value="${articleNamesSorted[i].replace(/\"/g, "&quot;")}">`;
                $("#guess-list").append(option);
            }
            
			for(var i=0;i<10;i++) { // load in the article names, summaries, imgs (for the top ten only)
				let index = articleNamesNormalised.indexOf(summariesData[i].title);
                
				summaries[index] = summariesData[i].description;
				
                if (summariesData[i].thumbnail !== undefined) {
                    let imageName = summariesData[i].thumbnail.source;
                    images[index] = imageName;
                    new Image().src = imageName; // pre-load images
                }
			}
            
            // load this onto page
			for(var i=0;i<10;i++) {
				$('.answer-text:eq(' + i + ')').html(censor(articleNamesNormalised[i]));
                if (summaries[i] !== undefined) {
				    $('.summary-text:eq(' + i + ')').html(summaries[i]);
                } else {
				    $('.summary-text:eq(' + i + ')').html("<em>no description :(</em>")
                }
				$('.pageviews:eq(' + i + ')').html("(" + viewCountsCommas[i] + " pageviews)");
				topTen.push(articleNamesNormalised[i]);
			}
		});
	});
});
