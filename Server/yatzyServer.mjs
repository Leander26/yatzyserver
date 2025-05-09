import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { get } from './get.js'
import { renderFile } from 'pug';
import { join } from 'path';
import express, { response, json } from 'express';
import sessions from 'express-session';
import { getDices, getNewScoreCard, getNewFieldStatus, throwDices, calculateScoreCard } from './gameLogic.js'

const __dirname = dirname(fileURLToPath(import.meta.url));

let app = express();
app.use(sessions({ secret: 'hemmelig', saveUninitialized: true, cookie: { maxAge: 1000 * 60 * 20 }, resave: false }));
app.use(json());

app.set('view engine', 'pug');
app.set('views', join(__dirname, '/views'));
app.set('public', join(__dirname, '/public'));
app.use(express.static(join(__dirname, 'public')));

let players = [];
const maxPlayers = 6;
const lifeCycle = 30; // seconds
const lifeCycleFinish = 600; // seconds
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


/**
 * Sorts the players list so that the current player (by session ID) is first,
 * followed by the remaining players sorted alphabetically by username.
 *
 * @param {string} sessionID - The session ID of the current player.
 * @returns {Array} Sorted list of players with the current player first.
 */
function sortPlayers(sessionID) {
    const self = players.find(p => p.user.id === sessionID);
    const others = players
        .filter(p => p.user.id !== sessionID)
        .sort((a, b) => a.user.username.localeCompare(b.user.username));
    return self ? [self, ...others] : others;
}

/**
 * Sends the sorted list of players as a JSON response.
 * Ensures that the current player is first in the list.
 *
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
function respondWithSortedPlayers(req, res) {
    res.json(sortPlayers(req.sessionID));
}

/**
 * Renders the welcome screen where the player can enter their name.
 *
 * @route GET /welcome/
* @returns {HTML} The welcome page.
 */
app.get('/welcome/', async (req, res) => {
    res.render('welcome', { playerCount: players.length, maxPlayers: maxPlayers });
});

/**
 * Authenticates and registers a new player based on the provided username.
 * Sets up session data and creates a new Player object if not already registered.
 *
 * @route GET /auth
 * @query {string} username - The player's chosen username.
 * @returns {status} 200 OK if successful, 400 if username is missing.
 */
app.get('/auth', (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ error: "Missing username" });
    }

    req.session.user = { username, id: req.sessionID };

    if (!players.find(p => p.user.id === req.sessionID)) {
        let p = new Player(req.session.user);
        p.scorecard.playerName = p.user.username;
        players.push(p);
    }

    return res.sendStatus(200); // OK, session sat
});


/**
 * Returns the sorted list of player objects for the current session.
 *
 * @route GET /yatzy/
 * @returns {object[]} List of player objects.
 * @returns {status} 401 if the session is missing or invalid.
 */
app.get('/yatzy/', (req, res) => {
    let user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: "Unauthorized: No session or username." });
    }else{
        let player = players.find(p => p.user.id === req.sessionID);

        if (!player) {
            return res.status(404).json({ error: "Player not found." });
        }

        // Check if the player has selected all fields
        if (player.scorecard.fieldsLeft !=0 && player.throwCount < 3 ) {
           player.lastUpdated = Date.now();
        }

        respondWithSortedPlayers(req, res);
    }
});

/**
 * Rolls all non-held dice for the current player and updates their scorecard.
 *
 * @route POST /throwdice/
 * @returns {object[]} Updated list of player objects.
 * @returns {status} 302 if session is missing, 404 if player is not found.
 */
app.post('/throwdice/', (req, res) => {
    let user = req.session.user;
    if (user == undefined) {
        return res.status(302).json({ error: "Cannot throw dice due to missing player session." })
    } else {
        let player = players.find(p => p.user.id === req.sessionID);

        if (!player) {
            return res.status(404).json({ error: "Player not found." });
        }

        // Check if the player has selected all fields
        if (player.scorecard.fieldsLeft !=0 && player.throwCount < 3) {
            // Kaster kun de terninger, der ikke er på hold
            throwDices(player.dices, player);
    
            // Beregner mulige points på åbne felter
            calculateScoreCard(player.scorecard, player.dices, player.fieldStatus);
           player.lastUpdated = Date.now();
        }

        respondWithSortedPlayers(req, res);
    }
});

/**
 * Updates which dice are being held by the current player.
 *
 * @route POST /holddice/
 * @body {boolean[]} holdDices - An array of booleans representing dice hold status.
 * @returns {object[]} Updated list of player objects.
 * @returns {status} 302 if session is missing, 404 if player not found, 400 if data is invalid.
 */
app.post('/holddice/', (req, res) => {
    let user = req.session.user;
    if (user == undefined) {
        return res.status(302).json({ error: "Cannot hold dice due to missing player session." })
    } else {
        let player = players.find(p => p.user.id === req.sessionID);

        if (!player) {
            return res.status(404).json({ error: "Player not found." });
        }

        // Check if the player has selected all fields
        if (player.scorecard.fieldsLeft !=0 && player.throwCount < 3) {
            const { holdDices } = req.body;
    
            if (!holdDices || holdDices.length !== 5) {
                return res.status(400).json({ error: "Invalid holdDices data." });
            }
    
            // Opdater onHold status for hver terning
            for (let i = 0; i < player.dices.length; i++) {
                player.dices[i].setOnHoldStatus(holdDices[i]);
            }
            player.lastUpdated = Date.now();
        }


        respondWithSortedPlayers(req, res);
    }
});

/**
 * Marks a selected score field as used and resets the player's state for the next round.
 *
 * @route POST /selectfield/
 * @body {string} selectedField - The field name to be marked as used.
 * @returns {object[]} Updated list of player objects.
 * @returns {status} 302 if session is missing, 404 if player not found, 400 if field is invalid or already used.
 */
app.post('/selectfield/', (req, res) => {
    let user = req.session.user;
    if (user == undefined) {
        return res.status(302).json({ error: "Cannot select field due to missing player session." })
    }

    let player = players.find(p => p.user.id === req.sessionID);

    if (!player) {
        return res.status(404).json({ error: "Player not found." });
    }

    // Check if the player has selected all fields
    if (player.scorecard.fieldsLeft !=0) {
        const { selectedField } = req.body;
    
        if (!selectedField || !(selectedField in player.fieldStatus)) {
            return res.status(400).json({ error: "Invalid selectedField." });
        }
    
        if (player.fieldStatus[selectedField] === "used") {
            return res.status(400).json({ error: "Field already selected." });
        }
    
        // Lås feltet
        player.fieldStatus[selectedField] = "used";
    
        // Nulstil terninger til næste runde
        player.dices = getDices();
        player.dices.forEach(dice => dice.setOnHoldStatus(false));
        player.throwCount = 0;
        player.lastUpdated = Date.now();
    }

    respondWithSortedPlayers(req, res);
});

/**
 * Resets the current player's throw count to zero.
 *
 * @route POST /resetthrowcount/
 * @returns {object[]} Updated list of player objects.
 * @returns {status} 302 if session is missing, 404 if player not found.
 */
app.post('/resetthrowcount/', (req, res) => {
    let user = req.session.user;
    if (user == undefined) {
        return res.status(302).json({ error: "Cannot reset throw count due to missing player session." })
    }

    let player = players.find(p => p.user.id === req.sessionID);

    if (!player) {
        return res.status(404).json({ error: "Player not found." });
    }

    // Check if the player has selected all fields
        if (player.scorecard.fieldsLeft !=0) {
            // Reset throwCount
            player.throwCount = 0;
            player.lastUpdated = Date.now();
        }

    respondWithSortedPlayers(req, res);
})

/**
 * Resets the current player's game state to start a new game.
 * This includes resetting the throw count, scorecard, field status, and dice.
 *
 * @route POST /startnewgame/
 * @returns {object[]} Updated list of player objects.
 * @returns {status} 302 if session is missing, 404 if player not found.
 */
app.post('/startnewgame/', (req, res) => {
    let user = req.session.user;
    if (user == undefined) {
        return res.status(302).json({ error: "Cannot reset throw count due to missing player session." })
    }
    // Reset player
    let player = players.find(p => p.user.id === req.sessionID);
    player.throwCount = 0;
    player.scorecard = getNewScoreCard();
    player.fieldStatus = getNewFieldStatus();
    player.dices = getDices();
    player.lastUpdated = Date.now();

    respondWithSortedPlayers(req, res);
})

app.post('/leavegame/', (req, res) => {
    // Check if user is logged in
    let user = req.session.user;
    if (user == undefined) {
        // User is not logged in, redirect to welcome page
        return res.redirect('/welcome/');
    }

    let player = players.find(p => p.user.id === req.sessionID);

    // Check if player exists in the game
    if (!player) {
        return res.status(404).json({ error: "Player not found." });
    }

    // Remove player from players array
    players = players.filter(p => p.user.id !== req.sessionID);

    return res.status(302).json({ error: "Player removed from game." });
});

/**
 * Ensures that inactive players will release their session.
 */
function cleanUpPlayerList(){
    players = players.filter(p => {
        if (p.scorecard.fieldsLeft !=0) {
            return (Math.floor((Date.now() - p.lastUpdated) / 1000) < lifeCycle);
        }else{
            return (Math.floor((Date.now() - p.lastUpdated) / 1000) < lifeCycleFinish);
        }
    });
        
}

setInterval(() => cleanUpPlayerList(),1000);

app.listen(8000, () => console.log('Test running'));