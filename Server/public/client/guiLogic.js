import {
    gameState, throwDie, holdDice, selectField, startNewGame, leaveGame
} from "./yatzyProxy.js"

// Get game objects
let players = [];
let dices = null;
let throwCount = null;
let countDownValue = null;
let musicPlaying = false;
let fieldStatuses = [];
let fieldNames = [
    '1-S', '2-S', '3-S', '4-S', '5-S', '6-S', 'SUM',
    'BONUS', 'ONE PAIR', 'TWO PAIRS', 'THREE SAME',
    'FOUR SAME', 'FULL HOUSE', 'SMALL STRAIGHT',
    'LARGE STRAIGHT', 'CHANCE', 'YATZY', 'TOTAL'
];
let scorecardIDs = [
    'onesPoints', 'twosPoints', 'threesPoints', 'foursPoints', 'fivesPoints', 'sixesPoints', 'sumPoints',
    'bonusPoints', 'onePairPoints', 'twoPairPoints', 'threeOfAKindPoints',
    'fourOfAKindPoints', 'fullHousePoints', 'smallStraightPoints',
    'largeStraightPoints', 'chancePoints', 'yatzyPoints', 'totalPoints'
];

// Helper method
function getDicesHoldStatus() {
    const array = [];

    dices.forEach(d => {
        array.push(d.onHold);
    })

    return array;
}

// Draw dices
function drawDicesDiv() {
   let diceDiv = document.querySelector('.dices');
   let diceHTML = "";
   for (let i = 0; i < dices.length; i++) {
      diceHTML += `<img src="Media/dice-5-bubbleBobble.svg" id="dice${i}" />`;
   }
   diceHTML += `<div>
               <p id="statusThrowCount">THROWS: ${throwCount}</p>
               <p id="lifeCycle">COUNT DOWN: ${countDownValue}</p>
               </div>`;
   diceDiv.innerHTML = diceHTML;

    function addEventListeners() {
        let images = document.querySelectorAll('img');
        images.forEach(img => {
            img.addEventListener('click', async function () {
                let urlPre = 'Media/dice-';
                let urlPost = '-bubbleBobble.svg';
                let diceX = img.id.charAt(4);
                if (throwCount > 0) {
                    if (!dices[diceX].onHold) {
                        img.src = `Media/dice-${dices[diceX].value}-bubbleBobble-locked.svg`;
                        dices[diceX].onHold = true;
                        players = await holdDice(getDicesHoldStatus());
                        drawScoreCardArea(players[0]);
                    } else {
                        let diceValue = dices[diceX].value;
                        img.src = `${urlPre}${diceValue}${urlPost}`;
                        dices[diceX].onHold = false;
                        players = await holdDice(getDicesHoldStatus());
                        drawScoreCardArea(players[0]);
                    }
                }
            });
        });
    }

    addEventListeners();
}

// Draw html elements
function drawScoreCardArea() {
    const pointDiv = document.querySelector('.points');
    pointDiv.innerHTML = "";

    players.forEach(player => {
        let html = `<div class="player">`;
        html += `<h4>${player.user.username}</h4>`;
        html += `<h4>Points</h4>`;

        for (let i = 0; i < fieldNames.length; i++) {
            const fieldLabel = fieldNames[i];
            const scorecardID = scorecardIDs[i];
            const val = player.scorecard[scorecardID] ?? 0;
            const used = player.fieldStatus[scorecardID] != "open";
            const readOnlyAttr = used ? "disabled" : "readonly";

            // html += `<div>${fieldLabel}</div>`;
            html += `<p>${fieldLabel}</p><input type="text" id="${scorecardID}|${player.user.id}" value="${val}" ${readOnlyAttr}>`;
        }

        html += `</div>`;
        pointDiv.innerHTML += html;
    });

    document.querySelectorAll('.player input').forEach(field => {
        field.addEventListener('click', async function () {
            const [scorecardID, playerId] = this.id.split("|");
            if (playerId === players[0].user.id && throwCount > 0) {
                players = await selectField(scorecardID);
                fieldStatuses = players[0].fieldStatus;
                drawScoreCardArea();
            }
        });
    });
}

// Change dice images
function guiChangeDiceImg() {
    let diceImages = document.querySelectorAll('img');

    for (let i = 0; i < diceImages.length; i++) {
        let urlPre = 'Media/dice-';
        let urlPost = '-bubbleBobble.svg';
        if (!dices[i].onHold) {
            diceImages[i].src = `${urlPre}${dices[i].value}${urlPost}`;
        }
    }
}

// Throw dice
async function guiThrowDice() {
    let statusThrowCount = document.getElementById("statusThrowCount");
    players = await throwDie();
    dices = players[0].dices;
    guiChangeDiceImg();
    throwCount = players[0].throwCount;
    drawScoreCardArea();
    statusThrowCount.innerHTML = 'THROWS: ' + players[0].throwCount;
}

// Start new game
async function guiStartNewGame() {
    let statusThrowCount = document.getElementById("statusThrowCount");
    if (!musicPlaying) {
        var audio = document.getElementById("myAudio");
        audio.currentTime = 0;
        audio.play().catch(error => console.log("Autoplay blokeret:", error));
        musicPlaying = true;
    }
    players = await startNewGame();
    throwCount = players[0].throwCount;
    drawScoreCardArea();
    drawDicesDiv();
}

// Draw button div
function drawButtonArea() {
    let newElements = "";
    // Add button panel
    let btnPanel = document.querySelector('.btnPanel');
    newElements = '<button class="btnRoll" id="btnRoll"></button>';
    newElements += '<button class="btnNewGame" id="btnReset"></button>';
    newElements += '<button class="btnLeaveGame" id="btnLeaveGame"></button>';
    btnPanel.innerHTML = newElements;

    // Add event listeners to buttons
    let resetButton = document.getElementById("btnReset");
    resetButton.addEventListener("click", guiStartNewGame);
    let rollButton = document.getElementById("btnRoll");
    rollButton.addEventListener("click", guiThrowDice);

    let leaveButton = document.getElementById("btnLeaveGame");
    leaveButton.addEventListener("click", leaveGame);
}

// Draw HTMTL and calculate scorecard the first time.
async function start() {
   players = await gameState();
   dices = players[0].dices;
   throwCount = players[0].throwCount;
   fieldStatuses = players[0].fieldStatus;
   drawDicesDiv()
   let element = document.querySelector('#lifeCycle');
   countDownValue = Math.floor(players[0].lifeCycle - (Date.now() - players[0].lastUpdated) / 1000);
   element.innerHTML = `COUNT DOWN:  ${countDownValue} SECONDS`;
   drawButtonArea();
   drawScoreCardArea()
}
/**
** Updates the life cycle countdown and checks for game completion.
** If all players have selected all fields, it alerts the winner and redirects to the welcome page.
** If the countdown reaches zero, it alerts the user and redirects to the welcome page.
** It also checks if all players have selected all fields and alerts the winner.
** @returns {Promise<void>}
 */
async function updateLifeCycle(){
   let element = document.querySelector('#lifeCycle');

   players;

    if (players[0].scorecard.fieldsLeft != 0) {
        countDownValue = Math.floor(players[0].lifeCycle - (Date.now() - players[0].lastUpdated) / 1000);
    }else {
        countDownValue = Math.floor(players[0].lifeCycleFinish - (Date.now() - players[0].lastUpdated) / 1000);
        players = await gameState();
        drawScoreCardArea();
    }

   element.innerHTML = `COUNT DOWN:  ${countDownValue} SECONDS`;
   if (countDownValue < 0){
        players[0].lastUpdated = Date.now();
        alert("Player session has expiered. Please login again!");
        leaveGame();
   }

    let allPlayersSelected = players.every(player => {
        return Object.values(player.scorecard.fieldsLeft).filter(status => status === 0);
    });

    if (allPlayersSelected) {
        let winner = players.reduce((prev, current) => {
            return (prev.scorecard.totalPoints > current.scorecard.totalPoints) ? prev : current;
        });

        alert("*** Game is finished ***\n" +
              "All players have selected all fields.\n" +
              "The winner is: " + winner.user.username + "\n" +
              "With a total score of: " + (winner.scorecard.totalPoints ?? 0));
        
        leaveGame();
    }
}

setInterval(() => updateLifeCycle(),1000);
start();