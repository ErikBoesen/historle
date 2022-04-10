const elem = {
    object: document.getElementById('object'),
    entry: document.getElementById('entry'),
    year: document.getElementById('year'),
    submit: document.getElementById('submit'),
    guesses: document.getElementById('guesses'),
    victory: document.getElementById('victory'),
    instructionsButton: document.getElementById('instructions-button'),
    instructions: document.getElementById('instructions'),
    statsButton: document.getElementById('stats-button'),
    stats: document.getElementById('stats'),
    stat: {
        played: document.getElementById('stat-played'),
        winPercentage: document.getElementById('stat-win-percentage'),
        averageGuesses: document.getElementById('stat-average-guesses'),
        currentStreak: document.getElementById('stat-current-streak'),
        maxStreak: document.getElementById('stat-max-streak'),
    },
    share: document.getElementById('share'),
};

const START_DATE = new Date(2022, 2, 25);
let daysPassed = Math.floor((new Date() - START_DATE) / (1000 * 60 * 60 * 24));
let answer = answers[daysPassed % answers.length];

var date = new Date();
var currentDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                    .toISOString()
                    .split('T')[0];

let history = {};
let today = {guesses: [], complete: false};

function readState() {
    let stored = localStorage.history;
    console.log('Read stored history:', stored);
    if (stored != null) {
        history = JSON.parse(stored);
        if (history[currentDate]) {
            today = history[currentDate];
        }
        console.log('Loading stored history.');
    } else {
        elem.instructions.classList.add('shown');
    }
}

function storeState() {
    history[currentDate] = today;
    console.log('Storing history:', history);
    localStorage.history = JSON.stringify(history);
}

readState();

function getGuessColor(difference) {
    let distance = Math.abs(difference);
    if (distance == 0) return '#069c56';
    if (distance < 20) return '#FFC61A';
    if (distance < 100) return '#ff980e';
    if (distance < 500) return '#ff681e';
    return '#d3212c';
}
function getGuessEmoji(difference) {
    let distance = Math.abs(difference);
    if (distance == 0) return '✅';
    if (distance < 20) return '🟩';
    if (distance < 100) return '🟨';
    if (distance < 500) return '🟧';
    return '🟥';
}
function getGuessLabel(difference) {
    if (difference == 0) {
        return '';
    }
    let label;
    if (difference < 0) {
        label = '❯';
    } else if (difference > 0) {
        label = '❮';
    }
    return label.repeat((Math.log(Math.abs(difference)) / Math.log(10)) + 1);
}

function insertGuess(guess) {
    let tr = document.createElement('tr');
    let year = document.createElement('td');
    year.textContent = guess.year;
    tr.appendChild(year);
    let difference = document.createElement('td');
    difference.style.backgroundColor = getGuessColor(guess.difference);
    difference.textContent = getGuessLabel(guess.difference) || 'Correct!';
    tr.appendChild(difference);
    elem.guesses.prepend(tr);
}

function win() {
    elem.entry.style.display = 'none';
    elem.victory.style.display = 'block';
    elem.stats.classList.add('shown');
}

function daysElapsed(a, b) {
    let seconds = new Date(a).getTime() - new Date(b).getTime();
    let days = seconds / (1000 * 3600 * 24);
    return Math.abs(days);
}

function generateStatistics() {
    // Played
    // Win percentage
    let played = 0;
    let wins = 0;
    let averageGuesses = 0;
    for (let day in history) {
        played++;
        if (history[day].complete) {
            wins++;
            averageGuesses += history[day].guesses.length;
        }
    }
    averageGuesses = parseInt(averageGuesses / wins);

    let winPercentage = 0;
    if (played > 0) {
        winPercentage = parseInt(wins / played * 100);
    }

    let streak = 0;
    let lastWin = null;
    let maxStreak = 0;
    let currentStreak = 0;
    for (let date in history) {
        if (lastWin == null || daysElapsed(date, lastWin) != 1) {
            streak = 0;
        }
        streak += 1;
        lastWin = date;

        if (streak > maxStreak) maxStreak = streak;
        if (date == currentDate) currentStreak = streak;
    }

    elem.stat.played.textContent = played;
    elem.stat.winPercentage.textContent = winPercentage;
    elem.stat.averageGuesses.textContent = averageGuesses;
    elem.stat.maxStreak.textContent = maxStreak;
    elem.stat.currentStreak.textContent = currentStreak;
}

generateStatistics();


// Setup
elem.object.textContent = answer.name;
if (today.guesses) {
    for (let guess of today.guesses) {
        insertGuess(guess);
    }
}
if (today.complete) win();


// Element listeners
elem.year.oninput = function() {
    elem.submit.disabled = !Boolean(elem.year.value);
};

elem.submit.disabled = true;
elem.submit.onclick = function() {
    let guess = {
        year: parseInt(elem.year.value),
    };
    guess.difference = guess.year - answer.year;
    if (guess.difference == 0) {
        today.complete = true;
        win();
    }
    today.guesses.push(guess);
    insertGuess(guess);
    console.log('Added guess:', guess);
    storeState();
    elem.year.value = null;
    elem.submit.disabled = true;
    generateStatistics();
};

onclick = function(e) {
    let target = e.target;
    if (target.className === 'close-button') {
        target.parentElement.parentElement.classList.remove('shown');
    }
};

elem.instructionsButton.onclick = function() {
    elem.instructions.classList.toggle('shown');
};
elem.statsButton.onclick = function() {
    elem.stats.classList.toggle('shown');
};
elem.instructions.onclick = function() {
    elem.instructions.classList.remove('shown');
};
elem.stats.onclick = function() {
    elem.stats.classList.remove('shown');
};
elem.share.onclick = function(e) {
    e.stopPropagation();
    const dummyInput = document.createElement('textarea');
    // TODO: There is no elegance here. Only sleep deprivation and regret.
    dummyInput.style.opacity = 0;
    console.log(dummyInput.style.visibility);
    document.body.appendChild(dummyInput);
    let text = 'Historle #' + daysPassed + ':\n\n';
    for (let guess of today.guesses) {
        text += getGuessEmoji(guess.difference) + ' ' + getGuessLabel(guess.difference) + '\n';
    }
    text += '\n';
    text += 'Play more at https://erikboesen.com/historle!';
    dummyInput.value = text;
    dummyInput.focus();
    dummyInput.select();
    console.log(dummyInput);
    document.execCommand('copy');
};
