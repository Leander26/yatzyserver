import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {get} from './get.js'
import { renderFile } from 'pug';
import { join } from 'path';
import express, { response, json } from 'express';
import sessions from 'express-session';
import {getDices, getNewScoreCard, getNewFieldStatus} from './gameLogic.js'

const __dirname = dirname(fileURLToPath(import.meta.url));

let app = express();
app.use(sessions({ secret: 'hemmelig', saveUninitialized: true, cookie: { maxAge: 1000 * 60 * 20 }, resave: false }));
app.use(json());


app.set('view engine', 'pug');
app.set('views', join(__dirname, '/views'));
app.set('public', join(__dirname, '/public'));
app.use(express.static(join(__dirname, 'public')));

class player {
    constructor(user){
        this.user = user;
        this.dices = getDices();
        this.scorecard = getNewScoreCard();
        this.fieldStatus = getNewFieldStatus();
    }
}

let players = [];

// Checks whether user has been seen before
app.get('/welcome/', async (req, res) => {
    //new
});

/*
 * If no game is being played, a new game is started.
 * All players is returned
 */
app.get('/yatzy/',(req, res) => {
    let user = req.session.user;
    if (user == undefined){
        res.redirect('/welcome/')
    }else{
        return players.json();
    }
});

/*
 * 
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
        throwDices(player.dices);

        // Beregner mulige points på åbne felter
        calculateScoreCard(player.scorecard, player.dices, player.fieldStatus);

        res.json(players);
    }
});

/*
    Request must be an array of holdstatusses, client must hold the correct order of holdstatuses.
*/

app.post('/holddice/', (req, res) => {
    let user = req.session.user;
    if (user == undefined){
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

        res.json(players);
    }
});

/*
    Request must be a known field in the fieldstatus object.
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

    res.json(players);
});

app.listen(8000, () => console.log('Test running'));