/**
 * List of question categories for API.
 * @type {{1: {ID: number, Name: string}, 2: {ID: number, Name: string}, 3: {ID: number, Name: string}, 4: {ID: number, Name: string}, 5: {ID: number, Name: string}, 6: {ID: number, Name: string}, 7: {ID: number, Name: string}}}
 */
var categories = {
    1: {
        ID: 780,
        Name: 'American History'
    },
    2: {
        ID: 67,
        Name: 'Television'
    },
    3: {
        ID: 50,
        Name: 'U.S History'
    },
    4: {
        ID: 218,
        Name: 'Science & Nature'
    },
    5: {
        ID: 25,
        Name: 'Science'
    },
    6: {
        ID: 21,
        Name: 'Animals'
    },
    7: {
        ID: 42,
        Name: 'Sports'
    },
    8: {
       ID: 253,
       Name: 'Food & Drink'
    }
};

var game = {
    started: false,
    selectedCat: null,
    numberOfQuestions: 20,
    question: {
        question: null,
        value: 0,
        questionAnswer: null
    },
    player: {
        wins: 0,
        losses: 0,
        misses: 0
    },
    audio: {
        think: function () {
            stopAllAudio();
            thinkingAudio.play();
        },
        timeup: function () {
            stopAllAudio();
            timeUpAudio.play();
        }
    },
    answerTime: 30, // Time the player has to answer the question.
    questionPlays: 0 // Number of questions played thus far.
};

var winTimer = null;

var clock;

var thinkingAudio = new Audio('assets/sounds/thinkmusic.ogg');
var timeUpAudio = new Audio('assets/sounds/timeup.mp3');

/**
 * Stop all the sounds from playing on the page.
 */
var stopAllAudio = function () {
    thinkingAudio.pause();
    thinkingAudio.currentTime = 0;

    timeUpAudio.pause();
    timeUpAudio.currentTime = 0;
};


var updateWinLossAmount = function () {

    if(winTimer != null)
        clearTimeout(winTimer);

    $('#missed').text('Miss: ' + game.player.misses);
    $('#losses').text('Lost: ' + game.player.losses);
    $('#wins').text('Won: ' + game.player.wins);

    if (game.started)
        winTimer = setTimeout(updateWinLossAmount, 300);
};

/**
 * Create the categories on the page.
 */
var genCategories = function (elementID) {
    var i = 1;
    if ($('body').find('#' + elementID).length <= 0)
        throw new Error('Unable to find the element with the ID of ' + elementID);

    // Make sure we empty the HTML of the element if it's full.
    if ($('body').find('#' + elementID).length > 0)
        $('#' + elementID).html('');

    for (var key in categories) {
        var obj = categories[key];
        for (var prop in obj) {
            if (prop == 'Name') {
                var div = $('<div>');
                $('#' + elementID).append(
                    div.attr({
                        'class': 'col-xs-12 col-md-4 col-lg-5 game-tiles',
                        'data-cat': i
                    }).text(obj[prop]).css('display', 'none').fadeIn(500)
                );

                $(div).click( function() {
                    game.selectedCat = categories[$(this).data('cat')].ID;
                    $('#' + elementID).fadeOut();
                    startGame();
                });
                i++;
            }
        }
    }
}('gameBoard');

var getQuestion = function (categoryID) {
    if (!game.started)
        return; // Game has to be started first.

    if (typeof categoryID === 'undefined')
        throw new TypeError('Expecting an integer but instead got nothing');

    if (typeof categoryID !== "number")
        throw new TypeError('Expecting an integer but instead got ' + ((typeof categoryID) === 'string' ? 'a ' : 'an ') + (typeof categoryID));

    $.ajax({
        url: "http://jservice.io/api/clues?category=" + categoryID,
        beforeSend: function () {
            $('#answer').fadeOut();
            $('#gameBoard').html('');
            $('#question').html('<img src="assets/images/loading.gif"><h6>Loading next question...</h6>');
        }
    }).done( function( data ) {
        var question = data[Math.floor(Math.random() * data.length)];
        game.question.question = question.question;
        game.question.value = question.value;
        game.question.questionAnswer = question.answer;
        showQuestion();
    });
};

var showQuestion = function () {
    if(!game.started)
        return;

    $('#question').html('<p>' + game.question.question + '</p>');
    startTimer();
    $('#gameAnswer').html('');
    $('#gameGuess').val('');
    game.audio.think();
    $('#guess').fadeIn('fast');
};

var stopGame = function () {
    if (!game.started)
        throw new Error('No game started');

    game.started = false;
    cashTimer = null;
    $('#gameGuess').fadeIn('out');
};

var startGame = function () {
    game.started = true;
    updateWinLossAmount();
    getQuestion(game.selectedCat);
};

var startTimer = function () {
    var timer = game.answerTime, seconds;

        clock = setInterval( function() {
        seconds = parseInt(timer % 60, 10);

        $('#countdown').html("<h5>" + seconds + " Seconds Remaining</h5>");

        if (--timer < 0) {
            setTimeout(stopAllAudio, 1000); // End it cleanly.
            clearInterval(clock);
            $('#countdown').html('<h5>Times Up!</h5><h5>New game starts in 5 seconds.</h5>');
            $('#gameAnswer').html('<h4>The answer is: ' + game.question.questionAnswer + '</h4>');
            setTimeout(getQuestion, 5000, game.selectedCat);
            $('#guess').fadeOut('fast');
            game.player.misses++;
        }
    }, 1000);
};

var checkAnswer = function () {
    var answer = $('#gameGuess').val();
    if(answer == '')
        return;

    $('#guess').fadeOut('fast');

    if(answer.toLowerCase() == game.question.questionAnswer.toLowerCase()) {
        stopAllAudio(); // Not a clean ending :(
        clearInterval(clock);

        $('#countdown').html('New game starts in 5 seconds.</h5>');
        $('#gameAnswer').html('<h4>Correct!</h4><br><p><img src="assets/images/correct.gif"></p>');
        setTimeout(getQuestion, 5000, game.selectedCat);
        game.player.wins++;
    } else {
        stopAllAudio(); // Not a clean ending :(
        clearInterval(clock);

        $('#countdown').html('New game starts in 5 seconds.</h5>');
        $('#gameAnswer').html('<h4>Sorry, that is incorrect.<br>The answer is: ' + game.question.questionAnswer + '</h4><br><p><img src="assets/images/wrong.gif"></p>');
        setTimeout(getQuestion, 5000, game.selectedCat);
        game.player.losses++;
    }
};

$('#gameGuess').keypress(function (e) {
    if (e.which == 13) {
        e.preventDefault();
        checkAnswer();
        return false;
    }
});