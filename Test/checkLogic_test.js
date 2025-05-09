import { assert } from "chai";
import { describe } from "mocha";
import { getNewScoreCard, getNewFieldStatus, getDices, throwDices, getDiceFrequency, sameValuePoints, onePairPoints, twoPairPoints, threeOfAKindPoints,
    fourOfAKindPoints, smallStraightPoints, largeStraightPoints, fullHousePoints, chancePoints, yatzyPoints
 } from "../Server/gameLogic.js";

let scoreCard = null;
let throwCount = 0;
let dices = [];
let lifeCycleFinish = 600;
class Player {
    constructor(user) {
        this.user = user;
        this.dices = getDices();
        this.scorecard = getNewScoreCard();
        this.fieldStatus = getNewFieldStatus();
        this.throwCount = 0;
        this.lastUpdated = Date.now();
        this.lifeCycle = lifeCycle;
        this.lifeCycleFinish = lifeCycleFinish;
    }
}
let player = null;
let lifeCycle = 30;

before(() => {
    player = new Player("Player one");
    scoreCard = player.scorecard;
    throwCount = player.throwCount;
    dices = player.dices;
});

describe("Check scoreCasrd logic", () => {
    it("Get player name", () => {
        assert.equal(scoreCard.playerName, "Player one");
    });

    it("Top scores below bonus", () => {
        scoreCard.onesPoints = 2;
        scoreCard.twosPoints = 6;
        scoreCard.threesPoints = 9;
        scoreCard.foursPoints = 12;
        scoreCard.fivesPoints = 15;
        scoreCard.sixesPoints = 18;
        assert.equal(scoreCard.calculateTopScore(), 62);
        assert.equal(scoreCard.calculateBonusScore(), 0);
    });

    it("Top scores with bonus", () => {
        scoreCard.onesPoints = 3;
        scoreCard.twosPoints = 6;
        scoreCard.threesPoints = 9;
        scoreCard.foursPoints = 12;
        scoreCard.fivesPoints = 15;
        scoreCard.sixesPoints = 18;
        assert.equal(scoreCard.calculateTopScore(), 63);
        assert.equal(scoreCard.calculateBonusScore(), 50);
    });

    it("Buttom scores", () => {
        scoreCard.onePairPoints = 6;
        scoreCard.twoPairPoints = 8;
        scoreCard.threeOfAKindPoints = 9;
        scoreCard.fourOfAKindPoints = 12;
        scoreCard.smallStraightPoints = 15;
        scoreCard.largeStraightPoints = 20;
        scoreCard.fullHousePoints = 18;
        scoreCard.chancePoints = 20;
        scoreCard.yatzyPoints = 50;
        assert.equal(scoreCard.calculateBottomScore(), 158);
    });

    it("Total score", () => {
        scoreCard.onesPoints = 3;
        scoreCard.twosPoints = 6;
        scoreCard.threesPoints = 9;
        scoreCard.foursPoints = 12;
        scoreCard.fivesPoints = 15;
        scoreCard.sixesPoints = 18;
        scoreCard.onePairPoints = 6;
        scoreCard.twoPairPoints = 8;
        scoreCard.threeOfAKindPoints = 9;
        scoreCard.fourOfAKindPoints = 12;
        scoreCard.smallStraightPoints = 15;
        scoreCard.largeStraightPoints = 20;
        scoreCard.fullHousePoints = 18;
        scoreCard.chancePoints = 20;
        scoreCard.yatzyPoints = 50;
        assert.equal(scoreCard.calculateTotalScore(), 271);
    });

});

describe("Check frequency logic", () => {
    
    it("Get dice frequency", () => {
       let diceValue = 0;
        for (const dice of dices) {
            diceValue++;
            dice.value = diceValue;
       } 

        let frequency = getDiceFrequency(dices);
        for (let i = 0; i < frequency.length - 1; i++) {
            let f = frequency[i];
            assert.equal(f, 1);
        }
        assert.equal(frequency[5], 0);
   })
});

describe("Check dice logic", () => {
    it("Get dices", () => {
        assert.equal(dices.length, 5);
    })
    

    it("Check dice values", () => {
        dices.forEach(dice => {
            assert.isAtLeast(dice.value, 1);
            assert.isAtMost(dice.value, 6);
        });
    });

    it("Get throw count", () => {
        assert.equal(player.throwCount, 0);
    });

    it("Throw dices", () => {
        throwDices(dices,player);
        assert.equal(player.throwCount, 1);
    });

    it("Get dice frequency", () => {
        let frequency = getDiceFrequency(dices);
        let sum = 0;
        for (let i = 0; i < frequency.length; i++) {
            sum += frequency[i];
        }
        assert.equal(sum, 5);
    })

    
    it("Check dice frequency after holding all dices", () => {
        let olddiceFrequency = getDiceFrequency(player.dices);
    
        for (const dice of player.dices) {
            dice.setOnHoldStatus(true);
        }
    
        throwDices(dices,player);
        let newdiceFrequency = getDiceFrequency(player.dices);

        for (let i = 0; i < olddiceFrequency.length; i++) {
            assert.equal(olddiceFrequency[i], newdiceFrequency[i]);
        }
    });
});

describe("Check same value points", () => {
    it("Get same value points", () => {
        let diceValue = 0;
        for (const dice of dices) {
            diceValue++;
            dice.value = diceValue;
        }
        
        let frequency = getDiceFrequency(dices);

        for (let i = 1; i < frequency.length; i++) {
            let points = i;
            assert.equal(sameValuePoints(dices,i), points);
        }
        
    });
});

describe("Check one pair points", () => {
    it("One pair exact",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 2;
        dices[3].value = 3;
        dices[4].value = 6;

        assert.equal(onePairPoints(dices), 8);
    });

    it("One pair where two pair exist",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 5;
        dices[3].value = 5;
        dices[4].value = 6;

        assert.equal(onePairPoints(dices), 10);
    });

    it("No pair",() => {
        dices[0].value = 4;
        dices[1].value = 5;
        dices[2].value = 2;
        dices[3].value = 3;
        dices[4].value = 6;

        assert.equal(onePairPoints(dices), 0);
    });
});

describe("Check two pair points", () => {
    it("Two pair exact",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 5;
        dices[3].value = 5;
        dices[4].value = 6;

        assert.equal(twoPairPoints(dices), 18);
    });

    it("Two pair where three a like is pressent",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 4;
        dices[3].value = 6;
        dices[4].value = 6;

        assert.equal(twoPairPoints(dices), 20);
    });

    it("No pair",() => {
        dices[0].value = 4;
        dices[1].value = 5;
        dices[2].value = 2;
        dices[3].value = 3;
        dices[4].value = 6;

        assert.equal(twoPairPoints(dices), 0);
    });
});

describe("Check three of a kind points", () => {
    it("Three of a kind exact",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 4;
        dices[3].value = 5;
        dices[4].value = 6;

        assert.equal(threeOfAKindPoints(dices), 12);
    });

    it("Three of a kind where four of a kind is pressent",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 4;
        dices[3].value = 4;
        dices[4].value = 6;

        assert.equal(threeOfAKindPoints(dices), 12);
    });

    it("No three of a kind",() => {
        dices[0].value = 4;
        dices[1].value = 5;
        dices[2].value = 2;
        dices[3].value = 3;
        dices[4].value = 6;

        assert.equal(threeOfAKindPoints(dices), 0);
    });
});

describe("Check four of a kind points", () => {
    it("Four of a kind exact",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 4;
        dices[3].value = 4;
        dices[4].value = 6;

        assert.equal(fourOfAKindPoints(dices), 16);
    });

    it("Four of a kind where there is yatzy",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 4;
        dices[3].value = 4;
        dices[4].value = 4;

        assert.equal(fourOfAKindPoints(dices), 16);
    });

    it("No four of a kind",() => {
        dices[0].value = 4;
        dices[1].value = 5;
        dices[2].value = 2;
        dices[3].value = 3;
        dices[4].value = 6;

        assert.equal(fourOfAKindPoints(dices), 0);
    });
});

describe("Check small straight points", () => {
    it("Small straight exact",() => {
        dices[0].value = 1;
        dices[1].value = 2;
        dices[2].value = 3;
        dices[3].value = 4;
        dices[4].value = 5;

        assert.equal(smallStraightPoints(dices), 15);
    });

    it("Small straight where there is large straight",() => {
        dices[0].value = 2;
        dices[1].value = 3;
        dices[2].value = 4;
        dices[3].value = 5;
        dices[4].value = 6;

        assert.equal(smallStraightPoints(dices), 0);
    });

    it("No small straight",() => {
        dices[0].value = 1;
        dices[1].value = 2;
        dices[2].value = 3;
        dices[3].value = 4;
        dices[4].value = 6;

        assert.equal(smallStraightPoints(dices), 0);
    });
});

describe("Check large straight points", () => {
    it("Large straight exact",() => {
        dices[0].value = 2;
        dices[1].value = 3;
        dices[2].value = 4;
        dices[3].value = 5;
        dices[4].value = 6;

        assert.equal(largeStraightPoints(dices), 20);
    });

    it("Large straight where there is small straight",() => {
        dices[0].value = 1;
        dices[1].value = 2;
        dices[2].value = 3;
        dices[3].value = 4;
        dices[4].value = 5;

        assert.equal(largeStraightPoints(dices), 0);
    });

    it("No large straight",() => {
        dices[0].value = 1;
        dices[1].value = 2;
        dices[2].value = 3;
        dices[3].value = 4;
        dices[4].value = 6;

        assert.equal(largeStraightPoints(dices), 0);
    });
});

describe("Check full house points", () => {
    it("Full house exact",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 4;
        dices[3].value = 6;
        dices[4].value = 6;

        assert.equal(fullHousePoints(dices), 24);
    });

    it("Full house where there is yatzy",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 4;
        dices[3].value = 4;
        dices[4].value = 4;

        assert.equal(fullHousePoints(dices), 20);
    });

    it("No full house",() => {
        dices[0].value = 4;
        dices[1].value = 5;
        dices[2].value = 2;
        dices[3].value = 3;
        dices[4].value = 6;

        assert.equal(fullHousePoints(dices), 0);
    });
});

describe("Check chance points", () => { 
    it("Chance",() => {
        dices[0].value = 4;
        dices[1].value = 5;
        dices[2].value = 2;
        dices[3].value = 3;
        dices[4].value = 6;

        assert.equal(chancePoints(dices), 20);
    });
});

describe("Check yatzy points", () => {
    it("Yatzy",() => {
        dices[0].value = 4;
        dices[1].value = 4;
        dices[2].value = 4;
        dices[3].value = 4;
        dices[4].value = 4;

        assert.equal(yatzyPoints(dices), 50);
    });

    it("No yatzy",() => {
        dices[0].value = 4;
        dices[1].value = 5;
        dices[2].value = 2;
        dices[3].value = 3;
        dices[4].value = 6;

        assert.equal(yatzyPoints(dices), 0);
    });
});