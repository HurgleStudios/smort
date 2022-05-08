var EMOJILIST = ['🙂', '🤢', '🥶', '😈', '💀', '👽', '🤖', '😻', '🐵', '🐷', '🐹', '🐸', '🤡', '💩', '🐶', '🐼', '🐞', '🐨', '🐰', '🐮', ];

// Initialize the canvas
var srcCanvas = document.createElement('canvas');
srcCanvas.width = 960;
srcCanvas.height = 540;

var ctx = srcCanvas.getContext('2d');

var dstCanvas = document.getElementById('canvas');
var dstctx = dstCanvas.getContext('2d');

var screenOffsetX = 0;
var screenOffsetY = 0;
var gameScale = 0;
var newGameWidth = 0;
var newGameHeight = 0;
var dscale = 1920 / 1080;
var bgcolor = '#333333';

var bottles = [];
var bottleImg = new Image(); // Create new img element

var screenOrientation = 0; // 0 Horiz, 1 Vert
var maxSlots = 3;
var currentBottle = null;

window.onload = function() {
    window.addEventListener('resize', resizeGame);
    window.addEventListener('click', handleMouse);
    bottleImg.addEventListener('load', function() {
        initGame();
    }, false);
    bottleImg.src = 'bottle.png'; // Set source path
};

function initGame(numColors = 5, numSlots = 5) {
    bgcolor = getRandomRgb(0, 64);
    shuffle(EMOJILIST);
    bottles = [];
    maxSlots = numSlots;

    let startX = 48;
    let sizeX = 74;
    let startY = 15;
    let sizeY = 255;
    let countX = 12;
    if (screenOrientation == 1) {
        startX = 30;
        sizeX = 60;
        startY = 63;
        sizeY = 292;
        countX = 8;
    }

    let startarr = [];
    for (let i = 0; i < numColors; i++) {
        for (let j = 0; j < numSlots; j++) {
            startarr.push(i);
        }
    }
    shuffle(startarr);

    for (let i = 0; i < numColors + 2; i++) {
        bottles[i] = [];

        let cX = (i % countX);
        let cY = Math.floor(i / countX);
        let pX = (startX + (cX * sizeX));
        let pY = (startY + (cY * sizeY));

        for (let j = 0; j < numSlots; j++) {
            if (i < numColors) {
                let rX = Math.random() * srcCanvas.width;
                let rY = Math.random() * srcCanvas.height;
                let newBall = {
                    color: startarr.pop(),
                    atRest: false,
                    tgtX: pX + 25,
                    srcX: rX,
                    curX: rX,
                    tgtY: pY + 225 - (40 * j),
                    srcY: rY,
                    curY: rY,
                    highlight: false,
                    myBottle: i,
                    t: 0,
                };
                bottles[i].push(newBall)
            }
        }
        bottles[0][bottles[0].length - 1].highlight = true;
        curBottle = bottles[0][bottles[0].length - 1];
    }
    resizeGame();
    drawScreen();
}

//#region Update
function update() {
    // Check for game over
    // Moves and stuff
    // Update position
    for (let i = 0; i < bottles.length; i++) {
        for (let j = bottles[i].length - 1; j >= 0; j--) {
            let bottle = bottles[i][j];
            if (!bottle.atRest) {
                bottle.t += 0.05;
                if (bottle.t > 1) {
                    bottle.t = 0;
                    bottle.atRest = true;
                    bottle.curX = bottle.srcX = bottle.tgtX;
                    bottle.curY = bottle.srcY = bottle.tgtY;
                } else {
                    bottle.curX = bez3(bottle.t, bottle.srcX, (bottle.tgtX + bottle.srcX) / 2, bottle.tgtX);
                    bottle.curY = bez3(bottle.t, bottle.srcY, 0, bottle.tgtY);
                }
            }
        }
    }
}

function bez3(t, x1, x2, x3) {
    return ((((1 - t) * (1 - t)) * x1) + (2 * (1 - t) * t * x2) + ((t * t) * x3));
}
//#endregion

//#region Mouse Handlers
function handleMouse(e) {
    let mX = (e.offsetX - screenOffsetX) / gameScale;
    let mY = (e.offsetY - screenOffsetY) / gameScale;

    let startX = 48;
    let sizeX = 74;
    let startY = 15;
    let sizeY = 255;
    let countX = 12;
    if (screenOrientation == 1) {
        startX = 30;
        sizeX = 60;
        startY = 63;
        sizeY = 292;
        countX = 8;
    }

    if (mX < startX) { clearHighlight(); return; } // Too far left!
    if (mY < startY) { clearHighlight(); return; } // Too far up!

    if ((mX - startX) % sizeX > 50) { clearHighlight(); return; } // Outside the bottle to the right!
    if ((mY - startY) % sizeY > 250) { clearHighlight(); return; } // Outside the bottle to the bottom!

    let bX = Math.floor((mX - startX) / sizeX);
    let bY = Math.floor((mY - startY) / sizeY);
    let bNum = (bY * countX) + bX;
    if (curBottle == null) {
        clearHighlight();
        if (bottles[bNum].length > 0) {
            bottles[bNum][bottles[bNum].length - 1].highlight = true;
            curBottle = bottles[bNum][bottles[bNum].length - 1];
        }
    } else {
        if (isValidMove(bNum)) {
            bottles[bNum].push(bottles[curBottle.myBottle].pop());
            curBottle.myBottle = bNum;
            curBottle.tgtX = (startX + 25 + (bX * sizeX));
            curBottle.tgtY = (startY + 25 + (bY * sizeY) + (40 * (6 - bottles[bNum].length)));
            curBottle.atRest = false;
            curBottle.highlight = false;
            curBottle = null;
            // Check if the current move is a valid one, and make it if so
        } else {
            clearHighlight();
            if (bottles[bNum].length > 0) {
                bottles[bNum][bottles[bNum].length - 1].highlight = true;
                curBottle = bottles[bNum][bottles[bNum].length - 1];
            }
        }
    }
}

function isValidMove(bNum) {
    // If the target bottle is full, the move fails.
    if (bottles[bNum].length == maxSlots) return false;

    // If the bottle is empty, the move succeeds. 
    if (bottles[bNum].length == 0) return true;

    // If the target bottle's top color doesn't match, the move fails.
    if (bottles[bNum][bottles[bNum].length - 1].color != curBottle.color) return false;

    // TODO: I'm sure I'm missing something. But anyway, return true!
    return true;
}

function clearHighlight() {
    curBottle = null;
    for (let i = 0; i < bottles.length; i++) {
        for (let j = 0; j < bottles[i].length; j++) {
            bottles[i][j].highlight = false;
        }
    }
}
//#endregion

//#region Draw
function drawScreen() {
    update();

    // Clear the little canvas
    ctx.fillStyle = '#234567';
    ctx.fillRect(0, 0, 960, 960);

    // Draw the game elements
    drawBottles();

    // Blit to the big canvas
    dstctx.fillStyle = bgcolor;
    dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
    dstctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
    window.requestAnimationFrame(drawScreen);
}

function drawBottles() {
    let startX = 48;
    let sizeX = 74;
    let startY = 15;
    let sizeY = 255;
    let countX = 12;
    if (screenOrientation == 1) {
        startX = 30;
        sizeX = 60;
        startY = 63;
        sizeY = 292;
        countX = 8;
    }

    ctx.font = '32px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < bottles.length; i++) {
        let cX = (i % countX);
        let cY = Math.floor(i / countX);
        let pX = (startX + (cX * sizeX));
        let pY = (startY + (cY * sizeY));

        // Draw the bottle itself
        ctx.drawImage(bottleImg, pX, pY + (50 * (5 - maxSlots)), 50, (50 * maxSlots));

        // Draw the contents
        for (let j = bottles[i].length - 1; j >= 0; j--) {
            let bottle = bottles[i][j];
            if (bottle.color > -1) {
                ctx.fillText(EMOJILIST[bottle.color], bottle.curX, bottle.curY);
                if (bottle.highlight) {
                    ctx.font = '48px serif';
                    ctx.globalAlpha = 0.33;
                    ctx.fillText('🟡', bottle.curX, bottle.curY);
                    ctx.font = '32px serif';
                    ctx.globalAlpha = 1;
                }
            }
        }
    }
}
//#endregion

//#region resize
function resizeGame() {
    dstCanvas.width = window.innerWidth;
    dstCanvas.height = window.innerHeight;

    if (dstCanvas.width >= dstCanvas.height) {
        dscale = 1920 / 1080;
        screenOrientation = 0;
        srcCanvas.width = 960;
        srcCanvas.height = 540;
        if (dstCanvas.width / dstCanvas.height > dscale) {
            newGameHeight = dstCanvas.height;
            newGameWidth = newGameHeight / 9 * 16;
            gameScale = newGameHeight / 540;
        } else {
            newGameWidth = dstCanvas.width;
            newGameHeight = newGameWidth / 16 * 9;
            gameScale = newGameWidth / 960;
        }
    } else { // FIXME! Make sure this proportions right
        dscale = 1080 / 1920;
        screenOrientation = 1;
        srcCanvas.width = 540;
        srcCanvas.height = 960;
        if (dstCanvas.width / dstCanvas.height > dscale) {
            newGameHeight = dstCanvas.height;
            newGameWidth = newGameHeight / 16 * 9;
            gameScale = newGameHeight / 960;
        } else {
            newGameWidth = dstCanvas.width;
            newGameHeight = newGameWidth / 9 * 16;
            gameScale = newGameWidth / 540;
        }
    }

    screenOffsetX = Math.abs((dstCanvas.width - newGameWidth)) / 2;
    screenOffsetY = Math.abs((dstCanvas.height - newGameHeight)) / 2;

}
//#endregion

//#region Utility
function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }

    return array;
}

function getRandomRgb(lo, hi) {
    var r = (lo + Math.round((hi - lo) * Math.random()));
    var g = (lo + Math.round((hi - lo) * Math.random()));
    var b = (lo + Math.round((hi - lo) * Math.random()));
    return 'rgb(' + r + ', ' + g + ', ' + b + ')';
}
//#endregion