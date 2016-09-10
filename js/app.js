states = {
    RUNNING: 0,
    ONBOARD: 1,
    OFFBOARD: -1,
    STOP: 2,
    HOMEFREE: 3,
    EXPLODE: 4,
    RESET: 5,
    GAMEOVER: 6
};

var allEnemies = [];
var allGems = [];

//
// Game Board object. It knows about the game board and how it is configured. It
// supplies the methods calls to update the items (i.e., enimies, players, gems,
//  etc.) that are on the board.
//

var Board = function() {

    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas elements height/width and add it to the DOM.
     */
    var state = states.RUNNING;
    var level = 0;
    var topRowY = -10;
    var bottomRowY = 332;
    var winnerSound = null; // Create an Audio object if the player wins
    var winnerSoundCnt = 0;
    this.cellWidth = 101;
    this.cellHeight = 83;
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = 505;
    canvas.height = 606;
    document.body.appendChild(canvas);

    /* This function is called by main (our game loop) and itself calls all
     * of the functions which may need to update entity's data.
     */
    this.update = function(dt) {
        if (player.getPoints() >= 120 && !winnerSound) {
            // http://www.findsounds.com/ISAPI/search.dll - list of sounds ==>
            //      http://www.qwizx.com/gssfx/usa/tpirding.wav
            winnerSound = new Audio('sounds/tpirding.wav');
        }
        updateEntities(dt);
    }

    /* This is called by the update function and loops through all of the
     * objects on the board. The update methods should focus purely on updating
     * the data/properties related to the object. Do your drawing in your
     * render methods.
     */
    function updateEntities(dt) {
        allEnemies.forEach(function(enemy) {
            enemy.update(dt);
        });
        player.update();
        allGems.forEach(function(gem) {
            gem.update();
        });
    }

    /* This function initially draws the "game level", it will then call
     * the renderEntities function. Remember, this function is called every
     * game tick (or loop of the game engine) because that's how games work -
     * they are flipbooks creating the illusion of animation but in reality
     * they are just drawing the entire screen over and over.
     */

    this.render = function() {
        /* This array holds the relative URL to the image used
         * for that particular row of the game level.
         */
        var rowImages = [
                ['images/water-block.png', // Level0 - Top row is water
                    'images/stone-block.png', // Row 1 of 3 of stone
                    'images/stone-block.png', // Row 2 of 3 of stone
                    'images/stone-block.png', // Row 3 of 3 of stone
                    'images/grass-block.png', // Row 1 of 2 of grass
                    'images/grass-block.png' // Row 2 of 2 of grass
                ],
                ['images/water-block.png', // Level3 - Top row is water
                    'images/stone-block.png', // Row 1 of 3 of stone
                    'images/stone-block.png', // Row 2 of 3 of stone
                    'images/stone-block.png', // Row 3 of 3 of stone
                    'images/Rock.png', // Row 1 of 1 of rock
                    'images/grass-block.png' // Row 1 of 1 of grass
                ]
            ],
            numRows = 6,
            numCols = 5,
            row, col;

        /* Loop through the number of rows and columns we've defined above
         * and, using the rowImages array, draw the correct image for that
         * portion of the "grid"
         */
        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                /* The drawImage function of the canvas' context element
                 * requires 3 parameters: the image to draw, the x coordinate
                 * to start drawing and the y coordinate to start drawing.
                 * We're using our Resources helpers to refer to our images
                 * so that we get the benefits of caching these images, since
                 * we're using them over and over.
                 */
                ctx.drawImage(Resources.get(rowImages[levelParams[level]
                    .boardSetup][row]), col * 101, row * 83);
            }
        }

        renderEntities();
    }

    /* This function is called by the render function and is called on each game
     * tick. Its purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    function renderEntities() {
        var frequency = 800; // frequency of blinking text

        showStats(); // Show Score, lives, etc.
        if (state == states.GAMEOVER) {
            // Game is over.  Stop futher rending
            if (Math.floor(Date.now() / frequency) % 2) {
                ctx.fillStyle = 'red';
                ctx.font = "bold 75px Helvetica";
                ctx.fillText('GAME OVER', 20, 220);
            }
            ctx.fillStyle = 'black';
            ctx.font = "bold 25px Helvetica";
            ctx.fillText('Hit \'Enter\' to start a new game!', 70, 220 + 40);
            return;
        }

        /*
         * Game is not over. Loop call the object render functions
         */
        allEnemies.forEach(function(enemy) {
            enemy.render();
        });
        player.render();
        allGems.forEach(function(gem) {
            gem.render();
        });
    }

    /*
     * Show the Score, lives, etc. across the top of the board.
     */
    function showStats() {
        var points = player.getPoints();
        var lives = player.getLives();
        var frequency = 800; // Controls frequency of text blinks

        ctx.clearRect(0, 0, canvas.width, 50);
        ctx.font = "25px Helvetica";
        ctx.fillStyle = 'white';
        ctx.fillText('Points: ' + points, 0, 40);
        ctx.fillText('Lives: ' + lives, canvas.width - 90, 40);

        // winnerSound will get created and played if the player wins.
        // Blink the text a few times and play the sound
        if (winnerSound) {
            ctx.font = "bold 40px Helvetica";
            ctx.fillStyle = 'green';
            if (winnerSoundCnt < 75) {
                if (Math.floor(Date.now() / frequency) % 2) {
                    ctx.fillText('WINNER', 180, 40);
                    winnerSound.play();
                    winnerSoundCnt++;
                }
            } else {
                ctx.fillText('WINNER', 180, 40);
            }
        } else {
            ctx.font = "italic 25px Helvetica";
            ctx.fillStyle = 'yellow';
            ctx.fillText('Get 120 points to win!', 135, 40);
        }
    }

    /* Reset some things. Usually when the player dies.
     */
    function reset(onOffBoard) {
        loadEnimies(onOffBoard);
        loadGems();
    }

    this.drawBoard = function(image, x, y, width, height) {
        if (width > 0) {
            ctx.drawImage(image, x, y, width, height);
        } else {
            ctx.drawImage(image, x, y);
        }
    }

    /* Load the board and all of the images we know we're going to need. When
     * all of the images are loaded, the engine getd the 'onLoad' event and
     * calls the engine init() function to start the game animation.
     */
    this.initBoard = function() {
        level = 0;
        winnerSound = null;
        winnerSoundCnt = 0;
        bottomRowY = 400;
        reset(states.ONBOARD);
        Resources.load([
            'images/stone-block.png',
            'images/water-block.png',
            'images/grass-block.png',
            'images/enemy-bug.png',
            'images/Gem Green.png',
            'images/Gem Orange.png',
            'images/Heart.png',
            'images/Rock.png',
            'images/char-boy.png',
            'images/explodeSprite.png',
            'images/Star.png'
        ]);
    }

    /*
     * This array provides the options such as player start position, number
     * of enimies, etc. for each level of the game.
     */
    var levelParams = [{
            boardSetup: 0,
            playerX: 202,
            playerY: 321,
            enimies: 3,
            enemySpeed: 60,
            rows: 3,
            OrangeGem: 0,
            GreenGem: 0,
            HeartGem: 0
        },
        {
            boardSetup: 0,
            playerX: 202,
            playerY: 321,
            enimies: 4,
            enemySpeed: 120,
            rows: 3,
            OrangeGem: 3,
            GreenGem: 0,
            HeartGem: 1
        },
        {
            boardSetup: 0,
            playerX: 202,
            playerY: 321,
            enimies: 4,
            enemySpeed: 170,
            rows: 3,
            OrangeGem: 2,
            GreenGem: 2,
            HeartGem: 1
        },
        {
            boardSetup: 1,
            playerX: 202,
            playerY: 404,
            enimies: 4,
            enemySpeed: 200,
            rows: 4,
            OrangeGem: 2,
            GreenGem: 2,
            HeartGem: 1
        },
        {
            boardSetup: 1,
            playerX: 202,
            playerY: 404,
            enimies: 4,
            enemySpeed: 300,
            rows: 4,
            OrangeGem: 2,
            GreenGem: 2,
            HeartGem: 0
        }
    ];

    /*
     * Load the the array of enimies according to the game level
     * TODO: Enimies per row should probably have different or maybe random
     *       speeds. Maybe more random as the game level increases.
     */
    function loadEnimies(onOffBoard) {
        var rowNum;
        var eNum;
        var idx = 0;
        var lastX = 0;
        var incr = 0;
        var rowFactor;

        allEnemies = [];
        // console.log('lev='+level+', rows='+levelParams[level].rows+', enemy='+levelParams[level].enimies);
        for (rowNum = 1; rowNum <= levelParams[level].rows; rowNum++) {
            lastX = 50;
            rowFactor = (rowNum % 2) ? 1 : 2;
            for (eNum = 0; eNum < levelParams[level].enimies; eNum++) {
                allEnemies[idx] = new Enemy();
                allEnemies[idx].x = lastX + (allEnemies[idx].spriteWidth *
                    2) + (getRandomIntInclusive(Math.floor(allEnemies[
                        idx].spriteWidth / 2, allEnemies[idx].spriteWidth),
                    levelParams[level].enimies) * 100);
                allEnemies[idx].saveX = allEnemies[idx].x;
                lastX = allEnemies[idx].x;
                // Start enimies either on or off the board
                allEnemies[idx].x *= onOffBoard;
                allEnemies[idx].y += (incr * 83);
                allEnemies[idx].speed = levelParams[level].enemySpeed /
                    rowFactor;
                idx++;
            }
            incr++;
        }
    }

    /*
     * Load the the array of Gems according to the game level.  Gems are spread
     * evenly across the rows in random columns.
     */
    function loadGems() {
        var rowNum;
        var gNum;
        var idx = 0;
        var incr = 0;

        allGems = [];
        rowNum = 0;
        ['OrangeGem', 'GreenGem', 'HeartGem'].forEach((gem) => {
            gNum = levelParams[level][gem];
            while (gNum > 0) {
                allGems[idx] = GemsFactory.build(gem);
                allGems[idx].x = getRandomIntInclusive(0, canvas.width /
                    board.cellWidth) * board.cellWidth + 25;
                allGems[idx].y += (rowNum * 85);
                idx++;
                gNum--;
                rowNum < levelParams[level].rows - 1 ? rowNum++ : rowNum = 0;
            }
        });
    }

    /*
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
     *  Returns a random integer between min (inclusive) and max (exclusive)
     *  Using Math.round() will give you a non-uniform distribution!
     */
    function getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    /*
     * Check if a move is on or off the board. The function can be called
     * without specifing objWidth
     */
    this.validMove = function(x, y, objWidth) {
        var newX = x;
        if (objWidth) {
            newX += objWidth;
        }
        if (newX < 0) {
            return false;
        }
        if (y < 0) {
            if (level + 1 < levelParams.length) {
                level++;
                if (level == 3) {
                    bottomRowY = 415;
                }
            }
            reset(states.OFFBOARD);
            return false;
        }
        if ((newX <= canvas.width) && (y <= bottomRowY)) {
            return true;
        }
        // console.log('x='+x+', y='+y+', nx='+newX+', by='+bottomRowY+', ow='+objWidth);
        return false;
    }

    this.getBottomRow = function() {
        return bottomRowY;
    }

    this.getTopRow = function() {
        return topRowY;
    }

    this.getRows = function() {
        return levelParams[level].rows;
    }

    this.getPlayerStartPosition = function() {
        return { x: levelParams[level].playerX, y: levelParams[level].playerY }
    }

    this.setGameOver = function() {
        state = states.GAMEOVER;
    }

    /*
     * The boards input handler.  Currently only the 'Enter' key.
     * Either pause/resume toggles the game, or starts a new game
     */
    this.handleInput = function(key) {
        switch (key) {
            case "enter":
                switch (state) {
                    case states.RUNNING:
                        state = states.STOP;
                        Engine.stop();
                        return;
                    case states.STOP:
                        state = states.RUNNING;
                        Engine.resume();
                        return;
                    case states.GAMEOVER:
                        state = states.RUNNING;
                        this.initBoard();
                        player.init();
                        return;
                };
        };
    }

};

/*
 * Enemy object, these are what the player must avoid.
 */

var Enemy = function() {

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
    this.x = 0;
    this.saveX = 0;
    this.y = 63;
    this.speed = 0;
    this.spriteWidth = 0;
    this.state = states.ONBOARD;
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    var newX = this.x + (dt * this.speed);

    if (board.validMove(newX, this.y, null)) {
        this.x = newX;
        this.state = states.ONBOARD;
    } else {
        if (this.state == states.ONBOARD) {
            this.state = states.OFFBOARD;
            this.x = this.saveX * -1;
        } else {
            // Enemy is off board. Keep incrementing x until it gets on the board
            this.x = newX;
        }
    }
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    //  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    board.drawBoard(Resources.get(this.sprite), this.x, this.y);
    if (!this.spriteWidth) {
        this.spriteWidth = Resources.get(this.sprite)
            .width;
    }
};

/*
 * Player object
 */

var Player = function() {
    // The image/sprite for player, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/char-boy.png';
    this.spriteWidth = 0;
    this.x = 202;
    this.y = 321;
    this.points = 0;
    this.lives = 3;
    this.homeFreeSound = null;
    this.explodeSound = null;
    this.explodeCnt = 50;
    this.state = states.RUNNING;

    //  Sleep function for a short delay if the player reaches the water.
    // Provided by:
    //   http://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
    this.sleep = function(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
};

Player.prototype.init = function() {
    this.points = 0;
    this.lives = 3;
    this.y = 321;
    this.state = states.RUNNING;
};

Player.prototype.getPoints = function() {
    return this.points;
}

Player.prototype.getLives = function() {
    return this.lives;
}

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Player.prototype.update = function() {
    if (this.state == states.RESET) {
        this.reset();
        return;
    }
    allEnemies.forEach((enemy) => {
        if (this.collision(enemy)) {
            if (this.state == states.RUNNING) {
                this.state = states.EXPLODE;
                this.lives--;
                this.explode();
            }
            return;
        };
    });
    allGems.forEach((gem) => {
        if (this.collision(gem)) {
            if (gem instanceof GemsFactory.HeartGem) {
                this.lives += gem.points;
            } else {
                this.points += gem.points;
            }
            gem.sound();
            gem.delete();
        }
    });
};

Player.prototype.collision = function(obj) {
    var playerRow;
    var objRow;
    var rows = board.getRows();

    // Determine the row of the player and the collision object
    playerRow = Math.round(this.y / board.cellHeight);
    objRow = Math.round(obj.y / board.cellHeight);
    if (playerRow == objRow) {
        // Same row.  Now check if the x values are within range
        if (this.x > obj.x && this.x < (obj.x + obj.spriteWidth - 20) ||
            this.x < obj.x && (this.x + this.spriteWidth - 20) > obj.x) {
            return true;
        }
    }
    return false;
};

Player.prototype.explode = function() {
    // Change the player's sprite to the exploding star
    this.sprite = 'images/Star.png';
    this.render();
    if (!this.explodeSound) {
        // https://www.freesoundeffects.com/free-sounds/explosion-10070/
        this.explodeSound = new Audio('sounds/Explosion+1.wav');
    }
    this.explodeSound.play();
}

Player.prototype.homeFree = function() {
    this.y = board.getTopRow();
    // Ignore inputs (i.e., not RUNNING state) for a few seconds while the player is in the water
    this.state = states.HOMEFREE;
    this.points += 10;
    this.render();
    // Pause for a second or two before reseting to grass area
    this.sleep(300)
        .then(() => {
            this.reset();
        });
    if (!this.homeFreeSound) {
        // https://www.freesoundeffects.com/free-sounds/household-10036/20/tot_sold/20/2/
        this.homeFreeSound = new Audio('sounds/Bubble5.wav');
    }
    this.homeFreeSound.play();
}


/*
 * Update the players position according to user inputs.
 */
Player.prototype.handleInput = function(key) {
    var newPos;

    if (this.state != states.RUNNING) {
        return;
    }

    switch (key) {
        case "left":
            newPos = this.x - board.cellWidth;
            if (board.validMove(newPos, this.y)) {
                this.x = newPos;
            }
            break;
        case "up":
            newPos = this.y - board.cellHeight;
            if (board.validMove(this.x, newPos, null)) {
                this.y = newPos;
            } else {
                // At the top, can't go up any further
                this.homeFree();
            }
            break;
        case "right":
            newPos = this.x + board.cellWidth;
            if (board.validMove(newPos, this.y, this.spriteWidth)) {
                this.x = newPos;
            }
            break;
        case "down":
            newPos = this.y + board.cellHeight;
            if (board.validMove(this.x, newPos, null)) {
                this.y = newPos;
            } else {
                // At the bottom, can't go down any further
                this.y = board.getBottomRow();
            }
            break;
        default:
            return;
    }
};

// Draw the enemy on the screen, required method for game
Player.prototype.render = function() {

    //  Make the player blink (i.e., do not draw every time) if they collide with
    //  an enemy:
    //     http://gamedev.stackexchange.com/questions/70116/how-do-i-make-a-sprite-blink-on-an-html5-canvas;
    var frequency = 200;
    if (this.state == states.EXPLODE) {
        // Blink the star sprite (i.e., do not draw every time) after collision with an enemy
        if (Math.floor(Date.now() / frequency) % 2) {
            board.drawBoard(Resources.get(this.sprite), this.x, this.y);
        }
        this.explodeCnt--;
        if (this.explodeCnt <= 0) {
            this.state = states.RESET;
        }
        return;
    }

    board.drawBoard(Resources.get(this.sprite), this.x, this.y);
    if (!this.spriteWidth) {
        this.spriteWidth = Resources.get(this.sprite)
            .width;
    }
};

Player.prototype.reset = function() {
    var loc = board.getPlayerStartPosition();
    this.x = loc.x;
    this.y = loc.y;
    this.sprite = 'images/char-boy.png';
    this.explodeCnt = 50;
    if (this.lives <= 0) {
        this.state = states.GAMEOVER;
        board.setGameOver();
    } else {
        this.state = states.RUNNING;
    }
};

// Place the player object in a variable called player
var player = new Player();

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        13: 'enter',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };
    board.handleInput(allowedKeys[e.keyCode]);
    player.handleInput(allowedKeys[e.keyCode]);
});
