import {
    gameState, throwDie, holdDice, selectField, startNewGame, leaveGame
} from "./yatzyProxy.js"

// Get game objects
let players = [];
let gameOn = true;
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

/**
 * Returns an array of booleans indicating the hold status of each dice.
 * It iterates through the dices array and pushes the hold status of each dice into the array.
 * The function is used to send the hold status to the server when a dice is clicked.
 * @param {Array} dices - Array of dice objects.
 * @returns {Array} - Array of booleans indicating the hold status of each dice.
 */
function getDicesHoldStatus() {
    const array = [];

    dices.forEach(d => {
        array.push(d.onHold);
    })

    return array;
}

/**
 * Draws the dice images and the throw count in the UI.
 * It creates a div for each dice and populates it with the corresponding image.
 * The function also adds event listeners to the dice images for click events.
 * When a dice is clicked, it toggles the hold status and updates the scorecard area.
 */
function drawDicesDiv() {
   let diceDiv = document.querySelector('.dices');
   let diceHTML = "";
   for (let i = 0; i < dices.length; i++) {
      diceHTML += `<img src="Media/dice-5-bubbleBobble.svg" id="dice${i}" />`;
   }
   diceHTML += `<div>
               <p id="statusThrowCount">THROWS: ${throwCount}</p>
               <p id="lifeCycle">COUNT DOWN: ${countDownValue} SECONDS</p>
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

function drawOpponentScoreCardArea(pointDiv) {
    for (let j = 1; j < players.length; j++) {
        let html = `<div class="opponent">`;
        html += `<h4>${players[j].user.username}</h4>`;
        html += `<h4>Points</h4>`;

        for (let i = 0; i < fieldNames.length; i++) {
            const fieldLabel = fieldNames[i];
            const scorecardID = scorecardIDs[i];
            const val = players[j].scorecard[scorecardID] ?? 0;
            const used = players[j].fieldStatus[scorecardID] != "open";
            const readOnlyAttr = used ? "disabled" : "readonly";

            // html += `<div>${fieldLabel}</div>`;
            html += `<p>${fieldLabel}</p><input type="text" id="${scorecardID}|${players[j].user.id}" value="${val}" ${readOnlyAttr}>`;
        }

        html += `</div>`;
        pointDiv.innerHTML += html;
    }
}

/**
 * Draws the scorecard area for each player.
 * It creates a div for each player and populates it with their scorecard information.
 * The scorecard includes fields for points, bonus, and various scoring categories.
 * The function also adds event listeners to the input fields for selecting fields.
 * The event listeners handle the click events and update the scorecard accordingly.
 * @returns {Promise<void>}
 */
function drawScoreCardArea() {
    const pointDiv = document.querySelector('.points');
    pointDiv.innerHTML = "";

    /* Add player to scorecard area */
    let html = `<div class="player">`;
    html += `<h4>${players[0].user.username}</h4>`;
    html += `<h4>Points</h4>`;

    for (let i = 0; i < fieldNames.length; i++) {
        const fieldLabel = fieldNames[i];
        const scorecardID = scorecardIDs[i];
        const val = players[0].scorecard[scorecardID] ?? 0;
        const used = players[0].fieldStatus[scorecardID] != "open";
        const readOnlyAttr = used ? "disabled" : "readonly";

        // html += `<div>${fieldLabel}</div>`;
        html += `<p>${fieldLabel}</p><input type="text" id="${scorecardID}|${players[0].user.id}" value="${val}" ${readOnlyAttr}>`;
    }

    html += `</div>`;
    pointDiv.innerHTML += html;

    /* Add opponents to scorecard area */
    drawOpponentScoreCardArea(pointDiv);

    document.querySelectorAll('.player input').forEach(field => {
        field.addEventListener('click', async function () {
            const [scorecardID, playerId] = this.id.split("|");
            if (playerId === players[0].user.id && throwCount > 0) {
                drawDicesDiv();
                let statusThrowCount = document.getElementById("statusThrowCount");
                players = await selectField(scorecardID);
                fieldStatuses = players[0].fieldStatus;
                throwCount = players[0].throwCount;
                drawScoreCardArea();
                statusThrowCount.innerHTML = 'THROWS: ' + players[0].throwCount;
            }
        });
    });
}

/**
 * Updates the dice images based on their values and hold status.
 * It changes the image source for each dice based on its value and whether it is held or not.
 * The function is called when the dice are rolled or when the hold status changes.
 * It uses a loop to iterate through the dice images and update their sources accordingly.
 * @returns {Promise<void>}
 */
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

/**
 * Handles the event when the user clicks on a dice image.
 * It updates the dice image based on the current value and hold status.
 * It also updates the throw count and the scorecard area.
 * The function is called when the user clicks on a dice image.
 * It fetches the updated player data from the server and updates the UI accordingly.
 * @returns {Promise<void>}
 */
async function guiThrowDice() {
    let statusThrowCount = document.getElementById("statusThrowCount");
    players = await throwDie();
    dices = players[0].dices;
    guiChangeDiceImg();
    throwCount = players[0].throwCount;
    drawScoreCardArea();
    statusThrowCount.innerHTML = 'THROWS: ' + players[0].throwCount;
}

/**
 * Starts a new game by resetting the game state and updating the UI.
 * It fetches the player data, including dice values and throw count,
 * and updates the UI elements accordingly.
 * The function is called when the user clicks the "New Game" button.
 * It also plays background music if it is not already playing.
 * @returns {Promise<void>}
 */
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

/**
 * Draws the button area with event listeners for the buttons.
 * It creates buttons for rolling the dice, starting a new game,
 * and leaving the game.
 * The buttons are added to the button panel in the HTML.
 * The event listeners are set up to call the respective functions
 * when the buttons are clicked.
 * The function is called when the script is loaded.
 * @returns {Promise<void>}
 */
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

/**
 * Initializes the game by fetching the game state and setting up the UI.
 * It retrieves the player data, including dice values and throw count,
 * and updates the UI elements accordingly.
 * It also sets up the countdown timer for the game lifecycle.
 * The function is called when the script is loaded.
 * @returns {Promise<void>}
 */
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
   let allPlayersSelected = true;

    if (gameOn) {
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
      
        for (const p of players) {
            if (p.scorecard.fieldsLeft != 0){
                allPlayersSelected = false;
            }
        }

        if (allPlayersSelected) {
            gameOn = false;
            let playersRanked = players.sort((a, b) => {
                return (b.scorecard.totalPoints ?? 0) - (a.scorecard.totalPoints ?? 0);
            });
            let playerNames = playersRanked.map(player => player.user.username).join(", ");
            let playerPoints = playersRanked.map(player => player.scorecard.totalPoints ?? 0).join(", ");
      
            /* Create a string with the player names and their points and their ranking */
            let playerRankings = playersRanked.map((player, index) => {
                return `${index + 1}. ${player.user.username} - ${player.scorecard.totalPoints ?? 0}`;
            }).join("\n");

            alert("*** Game is finished ***\n" +
                "All players are done.\n" +
                "The rankings are:\n" +
                playerRankings                
            );
             
            leaveGame();
         }
    }
   
 

}

/**
 * Sets up the interval to update the life cycle countdown every second.
 * It calls the updateLifeCycle function to check the game state and update the UI.
 * The interval is set to 1000 milliseconds (1 second).
 * The function is called when the script is loaded.
 * @returns {Promise<void>}
 */
setInterval(() => updateLifeCycle(),1000);
start();