"use strict";


function getDate() {
  let d = new Date(),
    month = d.getUTCMonth() + 1,
    day = d.getUTCDate() - 1,
    output = d.getUTCFullYear() + '/' + (month < 10 ? '0' : '') + month + '/' + (day < 10 ? '0' : '') + day,
    dateOutput = new Date(d.getUTCFullYear(), month - 1, day, 0, 0, 0),
    intl = new Intl.DateTimeFormat("en", {
      month: "long"
    }).format(dateOutput),
  titleOutput = day + " " + intl + " " + d.getUTCFullYear();
  timerInput = output;
  dataURL = "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia.org/all-access/" + output;
  $('#title').html("Wikipedia guessing game:<br/>" + titleOutput);
}

function randomDate() {
  let ys = [2016, 2017, 2018, 2019, 2020, 2021, 2022],
    y = ys[Math.floor(Math.random() * ys.length)],
    m = Math.floor(Math.random() * 12) + 1,
    d = Math.floor(Math.random() * 30) + 1;
  if (m == 1 || m == 3 || m == 5 || m == 7 || m == 8 || m == 10 || m == 12) {
    d = Math.floor(Math.random() * 31) + 1;
  } else if (m == 2) {
    d = Math.floor(Math.random() * 28) + 1;
  }
  let output = y + '/' + (m < 10 ? '0' : '') + m + '/' + (d < 10 ? '0' : '') + d,
    dateObject = new Date(output),
    intlMonth = dateObject.toLocaleString("default", {
      month: "long"
    }),
    titleOutput = d + " " + intlMonth + " " + y;
  dataURL = "https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia.org/all-access/" + output;
  $('#title').html("Wikipedia guessing game:<br/>" + titleOutput);
}

function getData(a) {
  $('#guess').focus();
  return new Promise((resolve, reject) => {
    $.ajax({
      url: a,
      type: 'GET',
      success: function (data) {
        resolve(data)
      },
      error: function (error) {
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
      success: function (data) {
        resolve(data)
      },
      error: function (error) {
        reject(error)
      },
    });
  });
}

function mainFunction() {
  window.scrollTo(0,0);
  getData(dataURL).then((data) => {
      // <initialise for replay>
      $("#loading").show();
      $(".list").hide();
      $("#give-up").text(GIVE_UP_TEXT)
      GAME_OVER = false;
      articles = [];
      articleNames = [];
      articleNamesNormalised = [];
      articleNamesLowercase = [];
      viewCounts = [];
      viewCountsCommas = [];
	  alreadyAnswered = [];
      dataURL = "";
      viewsURL = "";
      descURL = "";
      summaries = ["", "", "", "", "", "", "", "", "", ""];
      images = ["", "", "", "", "", "", "", "", "", ""];
      names = ["", "", "", "", "", "", "", "", "", ""];
	  blocks = ["🟥","🟥","🟥","🟥","🟥","🟥","🟥","🟥","🟥","🟥"];
      correctArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      topTen = [];
      lives = 3;
      points = 0;
      $(".answer").each(function () {
        $(this).css("background-color", "#222")
          .css("background-image", "none")
		  .removeClass("wrong-answer")
		  .removeClass("correct-answer");
      });
      $('#guess').attr('disabled', false);
      $("i").removeClass("fa-regular");
      $("i").addClass("fa-solid");
      $('.points').html(points);
      $("#tm-seconds").html("00");
      $("#tm-minutes").html("00");
      $("#tm-hours").html("00:");
      // </initialise>

      articles = data.items[0].articles;

      for (var i = 0; i < articles.length; i++) {
        if (jQuery.inArray(articles[i].article, badTitles) == -1 && articles[i].article.match(badTitlesRegex) == null) {
          articleNames.push(articles[i].article.replace(/\"/g, "\""));
          articleNamesNormalised.push(articles[i].article.replace(/_/g, " "));
          articleNamesLowercase.push(articles[i].article.replace(/_/g, " ").toLowerCase());
          let pv = articles[i].views;
          viewCounts.push(articles[i].views);
          viewCountsCommas.push(articles[i].views.toLocaleString());
        }
      }
      articleNamesSorted = [...articleNamesNormalised];

      let titleString = "";
      for (var i = 0; i < 10; i++) {
        titleString += articleNames[i] + "%7C";
      }
      titleString = titleString.slice(0, -3);
      descURL = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=description%7Cpageimages%7Cwbentityusage&titles=" + titleString + "&redirects=1&formatversion=2&piprop=thumbnail&pithumbsize=800&pilicense=any&wbeuentities=Q5";

      getSummaries().then((data) => {
        let redirectList = data.query.redirects,
          isHuman = data.query.pages.wbentityusage;
	    summariesData = data.query.pages;
        if (redirectList !== undefined) {
          for (var i = 0; i < redirectList.length; i++) { // identify any redirects
            let redirFrom = redirectList[i].from,
              redirTo = redirectList[i].to,
              a = articleNamesNormalised.indexOf(redirFrom);
            if (a > -1) {
              articleNamesNormalised[a] = redirTo;
              articleNamesSorted.push(redirTo);
            }
          }
        }

        for (var i = 0; i < 10; i++) { // load in the article names, summaries, imgs (for the top ten only)
          let index = articleNamesNormalised.indexOf(summariesData[i].title);

          summaries[index] = summariesData[i].description;

          if (summariesData[i].thumbnail !== undefined) {
            let imageName = summariesData[i].thumbnail.source;
            images[index] = imageName;
            new Image().src = imageName; // pre-load images
          }

          if (summariesData[i].wbentityusage !== undefined) { // split human names
            let a = summariesData[i].title.split(" ");
            if (a[a.length - 1].match(/^\(/) !== null) { // if there's a bracketed term we don't want that
              names[index] = a[a.length - 2].toLowerCase();
            } else {
              names[index] = a[a.length - 1].toLowerCase();
            }
            if (!articleNamesLowercase.includes(names[index])) {
              articleNamesLowercase.push(names[index]);
            }
          }
        }

        articleNamesSorted.sort();
        
        // load this onto page
        for (var i = 0; i < 10; i++) {
          $('.answer-text:eq(' + i + ')').html(censor(articleNamesNormalised[i]));
          if (summaries[i] !== undefined) {
            $('.summary-text:eq(' + i + ')').html(summaries[i]);
          } else {
            $('.summary-text:eq(' + i + ')').html("<em>no description :(</em>")
          }
          $('.pageviews:eq(' + i + ')').html(viewCountsCommas[i] + " pageviews");
          topTen.push(articleNamesNormalised[i].toLowerCase());
        }
        populateGuessList();

        $(".list").fadeIn();
        $("#loading").hide();
        startTimer();
      }).catch(error => {
        $("#error-box").removeClass("hidden");
      });
    })
    .catch(error => {
      $("#error-box").removeClass("hidden");
    });
}

function userCorrect(index) {
  let correctAnswer = ".answer:eq(" + index + ")";
  $(correctAnswer + " .answer-text").html('<strong><a href="https://en.wikipedia.org/wiki/' + articleNames[index] + '" target="_blank">' + articleNamesNormalised[index] + '</a></strong>');
  $(correctAnswer).css('background-color', 'var(--green)');
  $(correctAnswer).addClass("correct-answer");
  $(correctAnswer).css('background-image', 'url(' + images[index] + ')');
  if (correctArray.indexOf(index) > -1) {
    correctArray.splice(correctArray.indexOf(index), 1);
  }
  $('#guess').val("");
  blocks[index] = "🟩";
  $('#guess').focus();
  points++;
  $('.points').html(points);

  //$('#correct').show().delay(1000).fadeOut();
  if (correctArray.length === 0) {
    return gameOver();
  }

  let randomStatement = correctWords[Math.floor(Math.random() * incorectWords.length)];
  $('#correct-text').html(randomStatement);
  $('#correct-modal').css({
    display: "flex"
  }).delay(ALERT_DURATION).fadeOut();
  $("#correct-modal > .modal-content").addClass("anim_float").delay(ALERT_DURATION).queue(() => {
    $("#correct > .modal-content").removeClass("anim_float")
  });
}

function userSubmit() {
  let guess = $('#guess').val().toLowerCase();
  let index = topTen.indexOf(guess);

  if (alreadyAnswered.indexOf(guess) == -1) {
	alreadyAnswered.push(guess);
  } else {
	$('#guess').val("");
	return;
  }

  // user is correct
  // in case we need to handle multiple correct values at the same time
  if (index !== null && index !== -1) {
    userCorrect(index);
  } else if (names.indexOf(guess) !== -1) {
    for (var i = 0; i < 10; i++) {
      if (names[i] == guess && alreadyAnswered.indexOf(guess) !== -1) {
		userCorrect(i);
		alreadyAnswered.push(articleNamesNormalised[i].toLowerCase());
		names[i] = "";
      }
    }
  } else {
    // user is incorrect
    lives -= 1;
    $("i:eq(" + lives + ")").removeClass("fa-solid");
    $("i:eq(" + lives + ")").addClass("fa-regular");
    $('#guess').val("");
    $('#guess').focus();
    let randomStatement = incorectWords[Math.floor(Math.random() * incorectWords.length)];
    $('#incorrect-text').html(randomStatement);
    $('#incorrect').css({
      display: "flex"
    }).delay(ALERT_DURATION).fadeOut();
    $("#incorrect > .modal-content").addClass("anim_screen_shake").delay(ALERT_DURATION).queue(() => {
      $("#incorrect > .modal-content").removeClass("anim_screen_shake")
    })
  }
  if (lives == 0) {
    return gameOver();
  }

  $('#guess').val("");
  populateGuessList();
}

function gameOver() {
  if (GAME_OVER)
    return

  GAME_OVER = true
  stopTimer();
  $('#guess').attr('disabled', 'disabled');
  for (var i = 0; i < correctArray.length; i++) {
    let unanswered = ".answer:eq(" + correctArray[i] + ")";
    $(unanswered).addClass("wrong-answer");
    $(unanswered).css('background-color', 'var(--red)');
    $(unanswered).css('background-image', 'url(' + images[correctArray[i]] + ')');
    $(unanswered + " .answer-text").html('<strong><a href="https://en.wikipedia.org/wiki/' + articleNames[correctArray[i]] + '" target="_blank">' + articleNamesNormalised[correctArray[i]] + '</a></strong>');
  }
  let points = 10 - correctArray.length;
  $('.points').html(points);
  $('#emoji').html(emoji[points]);
  for (var i=0;i<10;i++) {
	$(".answer-block:eq(" + i + ")").html(blocks[i]);
  }
  $('#game-over').removeClass('hidden');
}

$("#guess").on('keydown', function (e) {
  if ((e.key === 'Enter' || e.keyCode === 13) && $("#guess").val().length !== 0) {
    // "quick guess" the first choice in the guess list (if its the only one there) 
    if ($('#guess-list').children().length === 1)
      $('#guess').val($('#guess-list').children().first().val())

    userSubmit();
  }
});

$("#guess").on("submit", e => {
  userSubmit();
  $("#guess").val("");
})

$("#give-up").click(e => {
  if (GAME_OVER) {
    $("#give-up").addClass(GIVE_UP_CLASS)
    $("#give-up").removeClass(NEW_GAME_CLASS)
    $("#give-up").text(GIVE_UP_TEXT)
    randomGame();
  } else {
    $("#give-up").addClass(NEW_GAME_CLASS)
    $("#give-up").removeClass(GIVE_UP_CLASS)
    $("#give-up").text(NEW_GAME_TEXT)
    gameOver();
  }
})

function newDayTimer() {
  let tomorrowDate = new Date(),
    tomorrowMonth = tomorrowDate.getUTCMonth() + 1,
    tomorrowDay = tomorrowDate.getUTCDate() + 1,
    fullDate = tomorrowDate.getUTCFullYear() + '/' + (tomorrowMonth < 10 ? '0' : '') + tomorrowMonth + '/' + (tomorrowDay < 10 ? '0' : '') + tomorrowDay;

  const second = 1000,
    minute = second * 60,
    hour = minute * 60,
    day = hour * 24;

  const countDown = new Date(Date.UTC(tomorrowDate.getUTCFullYear(), tomorrowMonth, tomorrowDay, 0, 0, 0)).getTime();
  const x = setInterval(function () {
    const now = new Date().getTime(),
      distance = countDown - now;

    let hoursOut = Math.floor((distance % (day)) / (hour)),
      minutesOut = Math.floor((distance % (hour)) / (minute)),
      secondsOut = Math.floor((distance % (minute)) / second);

    $("#cd-hours").text((hoursOut < 10 ? '0' : '') + hoursOut);
    $("#cd-minutes").text((minutesOut < 10 ? '0' : '') + minutesOut);
    $("#cd-seconds").text((secondsOut < 10 ? '0' : '') + secondsOut);
  }, 0)
}

$("#help").click(function () {
  $("#help-modal").removeClass("hidden");
});

$("#help-close").click(function () {
  $("#help-modal").addClass("hidden");
});

$("#error-play").click(() => {
  $("#error-box").addClass("hidden");
  randomGame();
})

$("#review").click(function () {
  $("#game-over").addClass("hidden");
});

$("#colourblind-mode").click(function () {
  colourBlindMode();
});

$("#random").click(function () {
  $("#give-up").addClass(GIVE_UP_CLASS);
  $("#give-up").removeClass(NEW_GAME_CLASS);
  $("#give-up").text(GIVE_UP_TEXT);
  randomGame();
});

function censor(a) {
  let w = a.split(" ");
  let res = w.map(b => "<span class='word'>" + b.slice(0, 1) + b.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]/ug, "_&nbsp;").replace(/^./, "").replace(/$/, "</span>"));
  return res.join(" ");
}

$(document).ready(function () {
  getDate();
  mainFunction();
  newDayTimer();
});

$("#guess").on("input", e => {
  populateGuessList();
});

function populateGuessList() {
  $("#guess").autocomplete({
    source: articleNamesLowercase.sort(),
    open: function(e, ui) {
      let acData = $(this).data('ui-autocomplete');
      acData.menu.element.find('li').each(function() {
        let me = $(this);
        let keywords = acData.term.split(' ').join('|');
        let textWrapper = me.find('.ui-menu-item-wrapper');
		let text = textWrapper.text();
		let newTextHtml = text.replace(new RegExp("(" + keywords + ")", "gi"), '<span class="ui-autocomplete-term">$1</span>');
		textWrapper.html(newTextHtml);
      });
    },
    select: function() {
      $("#guess").val("");
    }
  });
}

function startTimer() {
  let start = Date.now();
  timerInterval = setInterval(function() {
    let delta = Date.now() - start;
    let tmSeconds = Math.floor(delta / 1000) % 60;
    let tmMinutes = Math.floor(((delta / 1000) / 60) % 60);
    let tmHours = Math.floor((delta / 1000) / 60 / 60);
    $("#tm-seconds").html((tmSeconds < 10 ? '0' : '') + tmSeconds);
    $("#tm-minutes").html((tmMinutes < 10 ? '0' : '') + tmMinutes);
	if (tmHours > 0) {
      $("#tm-hours").removeClass("hidden").html((tmHours < 10 ? '0' : '') + tmHours + ":");
      timerValue = (tmHours < 10 ? '0' : '') + tmHours + ":" + (tmMinutes < 10 ? '0' : '') + tmMinutes + ":" + (tmSeconds < 10 ? '0' : '') + tmSeconds;
	} else {
	  timerValue = (tmMinutes < 10 ? '0' : '') + tmMinutes + ":" + (tmSeconds < 10 ? '0' : '') + tmSeconds;
	}
  }, 500);
}

function stopTimer() {
  clearInterval(timerInterval);
  $(".timer-value").html(timerValue);
}

function colourBlindMode() {
  if ($("html").css("--green") == "#070") {
    $("html").css("--green","#22A");
	$("#colourblind-mode").html("Turn colourblind<br />mode off");
  } else {
    $("html").css("--green","#070");
	$("#colourblind-mode").html("Turn colourblind<br />mode on");
  }
}

function randomGame() {
  $("#game-over").addClass("hidden");
  randomDate();
  mainFunction();
}