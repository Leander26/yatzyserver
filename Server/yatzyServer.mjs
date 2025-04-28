import { dirname } from 'path';
import { fileURLToPath } from 'url';
import {get} from './get.js'
import { renderFile } from 'pug';
import { join } from 'path';
import express, { response, json } from 'express';
import sessions from 'express-session';
import {getDices, getNewScoreCard} from './gameLogic.js'

const __dirname = dirname(fileURLToPath(import.meta.url));

let app = express();
app.use(sessions({ secret: 'hemmelig', saveUninitialized: true, cookie: { maxAge: 1000 * 60 * 20 }, resave: false }));
app.use(json());


app.set('view engine', 'pug');
app.set('views', join(__dirname, '/views'));
app.set('public', join(__dirname, '/public'));
app.use(express.static(join(__dirname, 'public')));

class player {
    constructor(user, dices, scorecard){
        this.user = user
        this.dices = dices;
        this.scorecard = scorecard;
    }
}

let players = [];

// Checks whether user has been seen before
app.get('/welcome/', async (req, res) => {
    let user = req.session.user;
    if (user == undefined){
        user = {
            username: "",
            id: req.sessionID
        }
        let dices = getDices();
        let scorecard = getNewScoreCard();
        let p = new player(user,dices,scorecard);
        players.push(p);
    }
    res.render('welcome', {user})
});

/*
 * If no game is being played, a new game is started.
 * All players is returned
 */
app.get('/startgame/',(req, res) => {
    
    // return players[]
});

/*
 * 
 */
app.post('/throwdice/', (req, res) => {
    // req session id
    // return players[] 
});

app.post('/holddice/', (req, res) => {
    // diceX
    // return players[] 
});

app.post('/selectfield/', (req, res) =>{
    // field 
    // return players[] 
});

app.listen(8000, () => console.log('Test running'));