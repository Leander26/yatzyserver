import {
   startNewGame, throwDie, holdDice, selectField, resetThrowCount
} from "./yatzyProxy.js"

// Get game objects
let players = [];
let dices = null;
let throwCount = null;
let musicPlaying = false;



// Draw dices
function drawDicesDiv() {
   let diceDiv = document.querySelector('.dices');
   let diceHTML = "";
   for (let i = 0; i < dices.length; i++) {
      diceHTML += `<img src="Media/dice-5-bubbleBobble.svg" id="dice${i}" />`;
   }
   diceHTML += '<div> <p id="statusThrowCount"> THROWS: ' + throwCount + '</p6> </div>';
   diceDiv.innerHTML = diceHTML;

   function addEventListeners() {
      let images = document.querySelectorAll('img');
      images.forEach(img => {
         img.addEventListener('click', function () {
            let urlPre = 'Media/dice-';
            let urlPost = '-bubbleBobble.svg';
            let diceX = img.id.charAt(4);
            if (throwCount > 0) {
               if (!dices[diceX].getOnHoldStatus()) {
                  img.src = `Media/dice-${dices[diceX].value}-bubbleBobble-locked.svg`;
                  dices[diceX].setOnHoldStatus(true);
               } else {
                  let diceValue = dices[diceX].value;
                  img.src = `${urlPre}${diceValue}${urlPost}`;
                  dices[diceX].setOnHoldStatus(false);
               }
            }
         });
      });
   }

   addEventListeners();
}

// Draw html elements
function drawPlayerArea(player) {
   let scoreCard = player.scorecard;
   let fieldStatus = player.fieldStatus;
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

   let pointDiv = document.querySelector('.points');
   let newElements = "";
   let playerName = player.user.username;
   newElements += '<h4>' + playerName.toUpperCase() + '</h4> <br>';

   for (let i = 0; i < fieldNames.length; i++) {
      let fieldValue = fieldNames[i].toUpperCase();
      let scorecardID = scorecardIDs[i];

      newElements += `<p>${fieldValue}</p>`;
      if (fieldValue === 'SUM' || fieldValue === 'BONUS' || fieldValue === 'TOTAL') {
         newElements += `<input type='text' name='${fieldValue}' id='${scorecardID}' disabled value='0' />`;
      } else {
         newElements += `<input type='text' name='${fieldValue}' id='${scorecardID}' readonly value='0' />`;
      }
   }
   pointDiv.innerHTML = newElements;

   // Add button panel
   let btnPanel = document.querySelector('.btnPanel');
   newElements = '<button class="btnRoll" id="btnRoll"></button>';
   newElements += '<button class="btnNewGame" id="btnReset"></button>';
   btnPanel.innerHTML = newElements;

   // Add event listeners to buttons
   let resetButton = document.getElementById("btnReset");
   resetButton.addEventListener("click", () => {
      drawPlayerArea();
      if (!musicPlaying) {
         var audio = document.getElementById("myAudio");
         audio.currentTime = 0;
         audio.play().catch(error => console.log("Autoplay blokeret:", error));
         musicPlaying = true;
      }
   });
   let rollButton = document.getElementById("btnRoll");
   rollButton.addEventListener("click", guiThrowDice);

   // Add event listeners to fields
   function addEventListeners() {
      let fields = document.querySelectorAll('input');
      fields.forEach(field => {
         field.addEventListener('click', () => {
            if (throwCount > 0) {
               let rollButton = document.getElementById("btnRoll");
               field.disabled = true;
               fieldControl[field.id].status = "used";
               releaseDices(dices);
               updateFieldsLeft(scoreCard);
               // Stop rolling if all fields are used
               if(getFieldsLeft(scoreCard) != 0){
                  resetThrowCount();
                  throwCount = getThrowCount();
                  rollButton.disabled = false;
               }else{
                  rollButton.disabled = true;
               }
            }
         });
      });
   }

   // Call functions to prepare the game, some function calls are set to be prepare for a 'New game' (meaning that the game is reset).
   addEventListeners();
   // calculateScoreCard(scoreCard, dices, fieldControl);
   resetThrowCount();
   throwCount = player.throwCount;
   drawDicesDiv(throwCount);
   releaseDices(dices);
}

// Change dice images
function guiChangeDiceImg() {
   let diceImages = document.querySelectorAll('img');

   for (let i = 0; i < diceImages.length; i++) {
      let urlPre = 'Media/dice-';
      let urlPost = '-bubbleBobble.svg';
      if (!dices[i].getOnHoldStatus()) {
         diceImages[i].src = `${urlPre}${dices[i].value}${urlPost}`;
      }
   }
}

 // Throw dice
 function guiThrowDice() {
    let statusThrowCount = document.getElementById("statusThrowCount");
    let rollButton = document.getElementById("btnRoll");
    throwDices(dices);
    calculateScoreCard(scoreCard, dices, fieldControl);
    addValuesToFields();
    throwCount = getThrowCount();
    if (throwCount === 3) {
       rollButton.disabled = true;
       statusThrowCount.innerHTML = 'THROWS: ' + throwCount;
       releaseDices(dices);
    }
    guiChangeDiceImg();
 
    statusThrowCount.innerHTML = 'THROWS: ' + throwCount;
 }


// Draw HTMTL and calculate scorecard the first time.
async function start() {
   players = await startNewGame();
   dices = players[0].dices;
   throwCount = players[0].throwCount;
   drawPlayerArea(players[0]);          // Initierer resten af UI
}

start();