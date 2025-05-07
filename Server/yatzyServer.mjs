import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { get } from './get.js'
import { renderFile } from 'pug';
import { join } from 'path';
import express, { response, json } from 'express';
import sessions from 'express-session';
import { getDices, getNewScoreCard, getNewFieldStatus,throwDices,calculateScoreCard } from './gameLogic.js'

const __dirname = dirname(fileURLToPath(import.meta.url));

let app = express();
app.use(sessions({ secret: 'hemmelig', saveUninitialized: true, cookie: { maxAge: 1000 * 60 * 20 }, resave: false }));
app.use(json());


app.set('view engine', 'pug');
app.set('views', join(__dirname, '/views'));
app.set('public', join(__dirname, '/public'));
app.use(express.static(join(__dirname, 'public')));

class Player {
    constructor(user) {
        this.user = user;
        this.dices = getDices();
        this.scorecard = getNewScoreCard();
        this.fieldStatus = getNewFieldStatus();
        this.throwCount = 0;
    }
}

let players = [];

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
 */
app.get('/welcome/', async (req, res) => {
    res.render('welcome')
});

/**
 * Authenticates and registers a new player based on the provided username.
 * Sets up session data and creates a new Player object if not already registered.
 *
 * @route GET /auth
 * @query {string} username - The player's chosen name.
 * @returns {status} 200 OK if session and player are successfully set, 400 if username is missing.
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
 * Returns the current list of players.
 * Requires a valid session already initialized via /auth.
 * Responds with players sorted so the current player appears first.
 *
 * @route GET /yatzy/
 * @returns {object[]} JSON array of player objects.
 * @returns {status} 401 Unauthorized if session is not initialized.
 */
app.get('/yatzy/', (req, res) => {
    let user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: "Unauthorized: No session or username." });
    }else{
        respondWithSortedPlayers(req, res);
    }
});

/**
 * Rolls all non-held dice for the current player and updates the scorecard.
 *
 * @route POST /throwdice/
 * @returns {object[]} Updated list of players with recalculated scores.
*/
app.post('/throwdice/', (req, res) => {
    let user = req.session.user;
    if (user == undefined) {
        res.redirect('/welcome/');
    } else {
        let player = players.find(p => p.user.id === req.sessionID);

        if (!player) {
            return res.status(404).json({ error: "Player not found." });
        }

        // Kaster kun de terninger, der ikke er på hold
        throwDices(player.dices, player);

        // Beregner mulige points på åbne felter
        calculateScoreCard(player.scorecard, player.dices, player.fieldStatus);

        respondWithSortedPlayers(req, res);
    }
});

/**
 * Updates the player's dice hold status based on the array received.
 *
 * @route POST /holddice/
 * @body {boolean[]} holdDices - Array of 5 booleans indicating hold status.
 * @returns {object[]} Updated list of players.
 */
app.post('/holddice/', (req, res) => {
    let user = req.session.user;
    if (user == undefined) {
        res.redirect('/welcome/');
    } else {
        let player = players.find(p => p.user.id === req.sessionID);

        if (!player) {
            return res.status(404).json({ error: "Player not found." });
        }

        const { holdDices } = req.body;

        if (!holdDices || holdDices.length !== 5) {
            return res.status(400).json({ error: "Invalid holdDices data." });
        }

        // Opdater onHold status for hver terning
        for (let i = 0; i < player.dices.length; i++) {
            player.dices[i].setOnHoldStatus(holdDices[i]);
        }

        respondWithSortedPlayers(req, res);
    }
});

/**
 * Locks the selected field in the player's fieldStatus and resets for next round.
 *
 * @route POST /selectfield/
 * @body {string} selectedField - The field to be marked as used.
 * @returns {object[]} Updated list of players.
 */
app.post('/selectfield/', (req, res) => {
    let user = req.session.user;
    if (user == undefined) {
        res.redirect('/welcome/');
        return;
    }

    let player = players.find(p => p.user.id === req.sessionID);

    if (!player) {
        return res.status(404).json({ error: "Player not found." });
    }

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

    respondWithSortedPlayers(req, res);
});

/**
 * Resets the player's throw count to 0.
 *
 * @route POST /resetthrowcount/
 * @returns {object[]} Updated list of players.
 */
app.post('/resetthrowcount/', (req,res) => {
    let user = req.session.user;
    if (user == undefined) {
        res.redirect('/welcome/');
        return;
    }

    let player = players.find(p => p.user.id === req.sessionID);

    if (!player) {
        return res.status(404).json({ error: "Player not found." });
    }

    // Reset throwCount
    player.throwCount = 0;

    respondWithSortedPlayers(req, res);
})

app.post('startnewgame', (req,res) => {
    
})

app.listen(8000, () => console.log('Test running'));