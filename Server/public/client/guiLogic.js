import {
   startNewGame, throwDie, holdDice, selectField
} from "./yatzyProxy.js"

// Get game objects
let players = [];
let dices = null;
let throwCount = null;
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
function getDicesHoldStatus(){
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
   diceHTML += '<div> <p id="statusThrowCount"> THROWS: ' + throwCount + '</p6> </div>';
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
                  drawPlayerArea(players[0]);
               } else {
                  let diceValue = dices[diceX].value;
                  img.src = `${urlPre}${diceValue}${urlPost}`;
                  dices[diceX].onHold = false;
                  players = await holdDice(getDicesHoldStatus());
                  drawPlayerArea(players[0]);
               }
            }
         });
      });
   }

   addEventListeners();
}

// Draw html elements
function drawPlayerArea() {
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
            drawPlayerArea();
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
   let rollButton = document.getElementById("btnRoll");
   players = await throwDie();
   dices = players[0].dices;
   guiChangeDiceImg();
   throwCount = players[0].throwCount;
   drawPlayerArea(players[0]);
   statusThrowCount.innerHTML = 'THROWS: ' + players[0].throwCount;
 }

 function drawButtonArea(){
   let newElements = "";
      // Add button panel
      let btnPanel = document.querySelector('.btnPanel');
      newElements = '<button class="btnRoll" id="btnRoll"></button>';
      newElements += '<button class="btnNewGame" id="btnReset"></button>';
      btnPanel.innerHTML = newElements;
   
      // Add event listeners to buttons
      let resetButton = document.getElementById("btnReset");
      resetButton.addEventListener("click", () => {
         //TODO -> Alter usage if drawPlayerArea() 
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
 }

// Draw HTMTL and calculate scorecard the first time.
async function start() {
   players = await startNewGame();
   dices = players[0].dices;
   throwCount = players[0].throwCount;
   fieldStatuses = players[0].fieldStatus;
   drawDicesDiv()
   drawButtonArea();
   drawPlayerArea()
}

start();