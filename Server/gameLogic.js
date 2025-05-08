export { getNewScoreCard, getDices,throwDices,getDiceFrequency, sameValuePoints, onePairPoints, 
    twoPairPoints, threeOfAKindPoints, fourOfAKindPoints, fullHousePoints, smallStraightPoints, largeStraightPoints, chancePoints, yatzyPoints,
getNewFieldStatus, calculateScoreCard };

// Dice class
class Dice {
    constructor() {
        this.value = null;
        this.onHold = false;
    }

    throw() {
        this.value = Math.floor(Math.random() * 6) + 1;
    }

    getOnHoldStatus() {
        return this.onHold;
    }

    setOnHoldStatus(status) {
        this.onHold = status;
    }
}

class scoreCard {
    constructor(){
        // Player info
        this.playerName = "Player one";
        this.fieldsLeft = 15;
        // Top scores
        this.onesPoints = 0;
        this.twosPoints = 0;
        this.threesPoints = 0;
        this.foursPoints = 0;
        this.fivesPoints = 0;
        this.sixesPoints = 0;
        //SubTotal
        this.sumPoints = 0;
        this.bonusPoints = 0;
        // Buttom scores
        this.onePairPoints = 0;
        this.twoPairPoints = 0;
        this.threeOfAKindPoints = 0;
        this.fourOfAKindPoints = 0;
        this.smallStraightPoints = 0;
        this.largeStraightPoints = 0;
        this.fullHousePoints = 0;
        this.chancePoints = 0;
        this.yatzyPoints = 0;
        // Total
        this.totalPoints = 0;
    }
    
    // Calculate the score for the top section
    calculateTopScore() {
        let score = 0;
        score += this.onesPoints;
        score += this.twosPoints;
        score += this.threesPoints;
        score += this.foursPoints;
        score += this.fivesPoints;
        score += this.sixesPoints;

        return score;
    }

    // Calculate the score for the bottom section
    calculateBottomScore() {
        let score = 0;
        score += this.onePairPoints;
        score += this.twoPairPoints;
        score += this.threeOfAKindPoints;
        score += this.fourOfAKindPoints;
        score += this.smallStraightPoints;
        score += this.largeStraightPoints;
        score += this.fullHousePoints;
        score += this.chancePoints;
        score += this.yatzyPoints;

        return score;
    }

    // Calculate the total score
    calculateTotalScore() {
        let score = 0;
        score += this.calculateTopScore();
        score += this.calculateBottomScore();
        score += this.calculateBonusScore();

        return score;
    }

    // Calculate the bonus score
    calculateBonusScore() {
        let score = 0;
        let topScore = this.calculateTopScore();

        if (topScore >= 63) {
            score = 50;
        }

        return score;
    }
}

// Get a new scoreCard
function getNewScoreCard() {
    return new scoreCard();
}

// Dices and functions

// Create 5 dices
function getDices() {
    let dices = [];
    for (let index = 0; index < 5; index++) {
        let dice = new Dice();
        dice.throw();
        dices.push(dice);
    }
    return dices;
}

// Throws the dices
function throwDices(dices, player) {
    if (player.throwCount < 3){
        dices.forEach(dice => {
            if (!dice.getOnHoldStatus()) {
                dice.throw();
            }
        });
    
        player.throwCount++;
    }
}

// Get freqyency of the dice values
function getDiceFrequency(dices) {
    let frequency = [0, 0, 0, 0, 0, 0];

    for (let i = 0; i  < frequency.length; i++) {
        let count = 0;
        dices.forEach(dice => {
            if (dice.value === i + 1) {
                count++;
            }
        });
        frequency[i] = count;
    }
    return frequency;
}

// Get same-value points for the dices
function sameValuePoints(dices, value) {
    let index = getDiceFrequency(dices);

    return index[value - 1] * value;
}

// Get one pair points
function onePairPoints(dices) {
    let frequency = getDiceFrequency(dices);

    for (let i = frequency.length - 1; i >= 0; i--) {
        if (frequency[i] >= 2) {
            return (i + 1)  * 2;
        }
    }

    return 0;
}

// Get two pair points
function twoPairPoints(dices) {
    let frequency = getDiceFrequency(dices);
    let pairCount = 0;
    let score = 0;

    for (let i = frequency.length - 1; i >= 0; i--) {
        if (frequency[i] >= 2) {
            pairCount++;
            score += (i + 1) * 2;
        }
    }

    if (pairCount === 2) {
        return score;
    }

    return 0;
}

// Get three of a kind points
function threeOfAKindPoints(dices) {
    let frequency = getDiceFrequency(dices);

    for (let i = frequency.length - 1; i >= 0; i--) {
        if (frequency[i] >= 3) {
            return (i + 1) * 3;
        }
    }

    return 0;
}

// Get four of a kind points
function fourOfAKindPoints(dices) {
    let frequency = getDiceFrequency(dices);

    for (let i = frequency.length - 1; i >= 0; i--) {
        if (frequency[i] >= 4) {
            return (i + 1) * 4;
        }
    }

    return 0;
}

// Get full house points
function fullHousePoints(dices) {
    let frequency = getDiceFrequency(dices);
    let threeOfAKind = false;
    let twoOfAKind = false;

    for (let i = frequency.length - 1; i >= 0; i--) {
        if (frequency[i] === 3) {
            threeOfAKind = true;
        } else if (frequency[i] === 2) {
            twoOfAKind = true;
        } else if (frequency[i] === 5) {
            return (i + 1) * 5;
        }
    }

    if (threeOfAKind && twoOfAKind) {
        return onePairPoints(dices) + threeOfAKindPoints(dices);
    }

    return 0;
}

// Get small straight points
function smallStraightPoints(dices) {
    let frequency = getDiceFrequency(dices);

    for (let i = 0; i < frequency.length - 1; i++) {
        if (frequency[i] !== 1) {
            return 0;
        }
    }

    return 15;
}

// Get large straight points
function largeStraightPoints(dices) {
    let frequency = getDiceFrequency(dices);

    for (let i = 1; i < frequency.length; i++) {
        if (frequency[i] !== 1) {
            return 0;
        }
    }

    return 20;
}

// Get chance points
function chancePoints(dices) {
    let score = 0;

    dices.forEach(dice => {
        score += dice.value;
    });

    return score;
}

// Get yatzy points
function yatzyPoints(dices) {
    let frequency = getDiceFrequency(dices);

    for (let i = 0; i < frequency.length; i++) {
        if (frequency[i] === 5) {
            return 50;
        }
    }

    return 0;
}

/** Moved from guiLogic */

// Release dices
function releaseDices(dices) {
    dices.forEach(dice => {
       dice.setOnHoldStatus(false);
    });
 }

 // Update fields left on the scorecard
function updateFieldsLeft(scoreCard) {
    scoreCard.fieldsLeft = scoreCard.fieldsLeft - 1;
 }
 
 // Get fields left on the scorecard
 function getFieldsLeft(scoreCard) {
    return scoreCard.fieldsLeft;
 }
 


 // Calulate fields on the scorecard. Values are only calculated if the field is not used.
 function calculateScoreCard(scoreCard, dices, fieldStatus) {
    for (const field in fieldStatus) {
        if (fieldStatus[field] === "open" || fieldStatus[field] === "locked") {
            switch (field) {
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
                case 'sumPoints':
                    scoreCard.sumPoints = scoreCard.calculateTopScore();
                    break;
                case 'bonusPoints':
                    scoreCard.bonusPoints = scoreCard.calculateBonusScore();
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
                case'totalPoints':
                    scoreCard.totalPoints = scoreCard.calculateTotalScore();
                    break;
            }
        }
    }
}

function getNewFieldStatus() {
    return {
        onesPoints: "open",
        twosPoints: "open",
        threesPoints: "open",
        foursPoints: "open",
        fivesPoints: "open",
        sixesPoints: "open",
        sumPoints: "locked",
        bonusPoints: "locked",
        onePairPoints: "open",
        twoPairPoints: "open",
        threeOfAKindPoints: "open",
        fourOfAKindPoints: "open",
        fullHousePoints: "open",
        smallStraightPoints: "open",
        largeStraightPoints: "open",
        chancePoints: "open",
        yatzyPoints: "open",
        totalPoints: "locked"
    };
}