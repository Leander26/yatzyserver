import {
   getNewScoreCard, getDices, getThrowCount, resetThrowCount, throwDices, getDiceFrequency, sameValuePoints, onePairPoints, twoPairPoints, threeOfAKindPoints,
   fourOfAKindPoints, smallStraightPoints, largeStraightPoints, fullHousePoints, chancePoints, yatzyPoints
} from "./gameLogic.js"


// Get game objects
let dices = getDices();
let scoreCard = null;
let throwCount = getThrowCount();
let musicPlaying = false;

// Field info class that holds the status and color (and perhaps other) style of the field.
class fieldInfo {
   constructor() {
      this.status = null;
   }
}

let fieldControl = {};

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
            let urlPre = 'Media/dice-'
            let urlPost = '-bubbleBobble.svg'
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
function startGame() {
   scoreCard = getNewScoreCard();
   let fieldNames = [
      '1-S', '2-S', '3-S', '4-S', '5-S', '6-S', 'SUM',
      'BONUS', 'ONE PAIR', 'TWO PAIRS', 'THREE SAME',
      'FOUR SAME', 'FULL HOUSE', 'SMALL STRAIGHT',
      'LARGE STRAIGHT', 'CHANCE', 'YATZY', 'TOTAL'
   ];

   let scorecardIDs = ['onesPoints', 'twosPoints', 'threesPoints', 'foursPoints', 'fivesPoints', 'sixesPoints', 'sumPoints',
      'bonusPoints', 'onePairPoints', 'twoPairPoints', 'threeOfAKindPoints',
      'fourOfAKindPoints', 'fullHousePoints', 'smallStraightPoints',
      'largeStraightPoints', 'chancePoints', 'yatzyPoints', 'totalPoints'
   ];

   let pointDiv = document.querySelector('.points')
   let newElements = ""
   let playerName = scoreCard.playerName;
   newElements += '<h4>' + playerName.toUpperCase() + '</h4> <br>';

   for (let i = 0; i < fieldNames.length; i++) {
      let fieldValue = fieldNames[i].toUpperCase();
      let scorecardID = scorecardIDs[i];
      let field = new fieldInfo();
      fieldControl[scorecardID] = field

      newElements += `<p>${fieldValue}</p>`
      if (fieldValue === 'SUM' || fieldValue === 'BONUS' || fieldValue === 'TOTAL') {
         newElements += `<input type='text' name='${fieldValue}' id='${scorecardID}' disabled value='0' />`
      } else {
         newElements += `<input type='text' name='${fieldValue}' id='${scorecardID}' readonly value='0' />`
      }
   }
   pointDiv.innerHTML = newElements

   // Add button panel
   let btnPanel = document.querySelector('.btnPanel');
   newElements = '<button class="btnRoll" id="btnRoll"></button>';
   newElements += '<button class="btnNewGame" id="btnReset"></button>';
   btnPanel.innerHTML = newElements;

   // Add event listeners to buttons
   let resetButton = document.getElementById("btnReset");
   resetButton.addEventListener("click", () => {
      startGame();
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
   calculateScoreCard(scoreCard, dices, fieldControl);
   resetThrowCount();
   throwCount = getThrowCount();
   drawDicesDiv(throwCount);
   releaseDices(dices);
}

// Add values from scoreCard to the fields
function addValuesToFields() {
   let scorecardIDs = ['onesPoints', 'twosPoints', 'threesPoints', 'foursPoints', 'fivesPoints', 'sixesPoints', 'sumPoints',
      'bonusPoints', 'onePairPoints', 'twoPairPoints', 'threeOfAKindPoints',
      'fourOfAKindPoints', 'fullHousePoints', 'smallStraightPoints',
      'largeStraightPoints', 'chancePoints', 'yatzyPoints', 'totalPoints'
   ];

   for (let i = 0; i < scorecardIDs.length; i++) {
      let scorecardID = scorecardIDs[i];
      let field = document.getElementById(scorecardID);

      switch (scorecardID) {
         case 'sumPoints':
            field.value = scoreCard.calculateTopScore();
            field.setAttribute('style', `background-color: ${fieldControl[scorecardID].colorStyle}`);
            break;
         case 'bonusPoints':
            field.value = scoreCard.calculateBonusScore();
            field.setAttribute('style', `background-color: ${fieldControl[scorecardID].colorStyle}`);
            break;
         case 'totalPoints':
            field.value = scoreCard.calculateTotalScore();
            field.setAttribute('style', `background-color: ${fieldControl[scorecardID].colorStyle}`);
            break;
         default:
            if (!field.disabled) {
               field.value = scoreCard[scorecardID];
               field.setAttribute('style', `background-color: ${fieldControl[scorecardID].colorStyle}`);
            }
      }
   }
}

// Calulate fields on the scorecard. Values are only calculated if the field is not used.
function calculateScoreCard(scoreCard, dices, fieldControl) {
   for (const element of Object.keys(fieldControl)) {
      let field = fieldControl[element];
      if (field.status !== "used") {
         switch (element) {
            case 'onesPoints':
               scoreCard.onesPoints = sameValuePoints(dices, 1);
               break;
            case 'twosPoints':
               scoreCard.twosPoints = sameValuePoints(dices, 2);
               break;
            case 'threesPoints':
               scoreCard.threesPoints = sameValuePoints(dices, 3);
               break;
            case 'foursPoints':
               scoreCard.foursPoints = sameValuePoints(dices, 4);
               break;
            case 'fivesPoints':
               scoreCard.fivesPoints = sameValuePoints(dices, 5);
               break;
            case 'sixesPoints':
               scoreCard.sixesPoints = sameValuePoints(dices, 6);
               break;
            case 'onePairPoints':
               scoreCard.onePairPoints = onePairPoints(dices);
               break;
            case 'twoPairPoints':
               scoreCard.twoPairPoints = twoPairPoints(dices);
               break;
            case 'threeOfAKindPoints':
               scoreCard.threeOfAKindPoints = threeOfAKindPoints(dices);
               break;
            case 'fourOfAKindPoints':
               scoreCard.fourOfAKindPoints = fourOfAKindPoints(dices);
               break;
            case 'fullHousePoints':
               scoreCard.fullHousePoints = fullHousePoints(dices);
               break;
            case 'smallStraightPoints':
               scoreCard.smallStraightPoints = smallStraightPoints(dices);
               break;
            case 'largeStraightPoints':
               scoreCard.largeStraightPoints = largeStraightPoints(dices);
               break;
            case 'chancePoints':
               scoreCard.chancePoints = chancePoints(dices);
               break;
            case 'yatzyPoints':
               scoreCard.yatzyPoints = yatzyPoints(dices);
               break;
         }
      }

   }
}

// Update fields left on the scorecard
function updateFieldsLeft(scoreCard) {
   scoreCard.fieldsLeft = scoreCard.fieldsLeft - 1;
}

// Get fields left on the scorecard
function getFieldsLeft(scoreCard) {
   return scoreCard.fieldsLeft;
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

// Change dice images
function guiChangeDiceImg() {
   let diceImages = document.querySelectorAll('img')

   for (let i = 0; i < diceImages.length; i++) {
      let urlPre = 'Media/dice-'
      let urlPost = '-bubbleBobble.svg'
      if (!dices[i].getOnHoldStatus()) {
         diceImages[i].src = `${urlPre}${dices[i].value}${urlPost}`;
      }
   }
}

// Release dices
function releaseDices(dices) {
   dices.forEach(dice => {
      dice.setOnHoldStatus(false);
   });
}

// Draw HTMTL and calculate scorecard the first time.
startGame();