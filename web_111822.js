var EMOJILIST = [
    '🙂', '🤢', '🥶', '😈', '💀', '👽', '🤖', '😻', '🐵', '🐷',
    '🐹', '🐸', '🤡', '💩', '🐶', '🐼', '🐞', '🐨', '🐰', '🐮',
    '👻', '💘', '💣', '🧠', '🦷', '🐯', '🦒', '🦥', '🐧', '🐙',
    '🦠', '🌸', '🌵', '🍁', '🍎', '🥔', '🍄', '🥨', '🥩', '🦀',
    '🍩', '🌎', '🌕', '🌈', '🔥', '💧', '🎃', '🧨', '⚾', '🏀',
    '⚽', '🎱', '🎲', '🎨', '💡', '🧽',
];

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
var modalUp = false;

var bottles = [];
var bottleImg = new Image(); // Create new img element

var screenOrientation = 0; // 0 Horiz, 1 Vert
var maxSlots = 4;
var maxColors = 10;
var doHide = false;
var curBall = null;
var undoList = [];

window.onload = function() {
    window.addEventListener('resize', resizeGame);
    window.addEventListener('click', handleMouse);
    window.addEventListener('keydown', handleKeys);
    bottleImg.addEventListener('load', function() {
        let save = window.localStorage.getItem('SmortSave');
        if (save == null) {
            initGame(5, 3);
            resizeGame();
            drawScreen();
        } else {
            loadGame(save);
            resizeGame();
            drawScreen();
        }
    }, false);
    bottleImg.src = 'bottle.png'; // Set source path
};

function saveGame() {
    let sg = {
        'maxColors': maxColors,
        'maxSlots': maxSlots,
        'doHide': doHide,
        'bottles': bottles,
        'list': EMOJILIST,
        'undolist': undoList,
    }
    window.localStorage.setItem('SmortSave', JSON.stringify(sg));
}

function exportGame() {
    let sg = {
        'maxColors': maxColors,
        'maxSlots': maxSlots,
        'doHide': doHide,
        'bottles': bottles,
        'list': EMOJILIST,
        'undolist': undoList,
    }
    let sgStr = btoa(JSON.stringify(sg));
}

function importGame(sg) {
    let save = JSON.parse(atob(sg));
    maxColors = save['maxColors'] ?? maxColors;
    maxSlots = save['maxSlots'] ?? maxSlots;
    doHide = save['doHide'] ?? doHide;
    bottles = save['bottles'] ?? bottles;
    EMOJILIST = save['list'] ?? EMOJILIST;
    undoList = save['undolist'] ?? undoList;
}

function loadGame(sg) {
    let save = JSON.parse(sg);
    maxColors = save['maxColors'] ?? maxColors;
    maxSlots = save['maxSlots'] ?? maxSlots;
    doHide = save['doHide'] ?? doHide;
    bottles = save['bottles'] ?? bottles;
    EMOJILIST = save['list'] ?? EMOJILIST;
    undoList = save['undolist'] ?? undoList;
}

function initGame() {
    bgcolor = getRandomRgb(0, 64);
    shuffle(EMOJILIST);
    while (undoList.length > 0) {
        undoList.pop();
    }
    if (bottles.length > 0) {
        for (let i = 0; i < bottles.length; i++) {
            if (bottles[i].length > 0) {
                for (let j = 0; j < bottles[i].length; j++) {
                    delete(bottles[i][j]);
                }
            }
        }
    }
    bottles = [];

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
    for (let i = 0; i < maxColors; i++) {
        for (let j = 0; j < maxSlots; j++) {
            startarr.push(i);
        }
    }
    shuffle(startarr);

    for (let i = 0; i < maxColors + 2; i++) {
        bottles[i] = [];

        let cX = (i % countX);
        let cY = Math.floor(i / countX);
        let pX = (startX + (cX * sizeX));
        let pY = (startY + (cY * sizeY));

        for (let j = 0; j < maxSlots; j++) {
            if (i < maxColors) {
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
                    hidden: doHide,
                };
                bottles[i].push(newBall)
            }
        }
    }
    revealHiddens();
}

function resetBallPositions() {
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
    for (let i = 0; i < bottles.length; i++) {
        let cX = (i % countX);
        let cY = Math.floor(i / countX);
        let pX = (startX + (cX * sizeX));
        let pY = (startY + (cY * sizeY));
        for (let j = 0; j < bottles[i].length; j++) {
            bottles[i][j].atRest = false;
            bottles[i][j].tgtX = pX + 25;
            bottles[i][j].tgtY = pY + 225 - (40 * j);
            bottles[i][j].srcX = bottles[i][j].curX;
            bottles[i][j].srcY = bottles[i][j].curY;
            bottles[i][j].t = 0;
        }
    }
}

//#region Update
function update() {
    // Check for game over
    // Moves and stuff
    // Update position
    let checkWin = true;
    for (let i = 0; i < bottles.length; i++) {
        for (let j = bottles[i].length - 1; j >= 0; j--) {
            let ball = bottles[i][j];
            if (!ball.atRest) {
                checkWin = false;
                if (ball.curX == ball.tgtX && ball.curY == ball.tgtY) {
                    ball.t = 0;
                    ball.atRest = true;
                    ball.curX = ball.srcX = ball.tgtX;
                    ball.curY = ball.srcY = ball.tgtY;
                    continue;
                }
                ball.t += 0.05;
                if (ball.t > 1) {
                    ball.t = 0;
                    ball.atRest = true;
                    ball.curX = ball.srcX = ball.tgtX;
                    ball.curY = ball.srcY = ball.tgtY;
                } else {
                    ball.curX = bez3(ball.t, ball.srcX, (ball.tgtX + ball.srcX) / 2, ball.tgtX);
                    ball.curY = bez3(ball.t, ball.srcY, 0, ball.tgtY);
                }
            }
        }
    }
    if (checkWin) {
        for (let i = 0; i < bottles.length; i++) {
            if (bottles[i].length == 0) { continue; } // Keep going if this bottle is empty
            if (bottles[i].length != maxSlots) { return; } // Dump out unsuccessful if we have any partial bottles
            // We have to have maxSlots here, make sure they are the same
            for (let j = 0; j < maxSlots - 1; j++) { // Any adjacent two that don't match means we aren't solved
                if (bottles[i][j].color != bottles[i][j + 1].color) return;
            }
        }
        // No non-win conditions? Cool, we must have won!
        modalUp = true;
        MicroModal.show('win-modal', {
            onClose: modal => {
                modalUp = false;
                initGame();
            },
        });
    }
}

function bez3(t, x1, x2, x3) {
    return ((((1 - t) * (1 - t)) * x1) + (2 * (1 - t) * t * x2) + ((t * t) * x3));
}
//#endregion

//#region Mouse Handlers
function handleMouse(e) {
    if (modalUp) return; // Don't bother if something is currently up
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

    // Catch the hud case first
    if (mX > (srcCanvas.width - 50)) {
        if (mY > (srcCanvas.height - 50)) {
            // Bottom Right is Undo
            if (undoList.length > 0) {
                let move = undoList.pop();
                clearHighlight();
                curBall = null;
                makeMove(move[1], move[0]);
                return;
            }
        } else if (mY < 50) {
            // Top Right is About
            modalUp = true;
            MicroModal.show('info-modal', {
                onClose: modal => { modalUp = false; }
            });
            return;
        }
    } else if (mX < 50) {
        if (mY > (srcCanvas.height - 50)) {
            initGame();
        } else if (mY < 50) {
            document.getElementById('colorsInput').value = maxColors;
            document.getElementById('heightInput').value = maxSlots;
            document.getElementById('hiddenInput').checked = doHide;
            window.removeEventListener('click', handleMouse);
            MicroModal.show('options-modal', {
                onClose: modal => {
                    modalUp = false;
                    let newColors = parseInt(document.getElementById('colorsInput').value);
                    let newSlots = parseInt(document.getElementById('heightInput').value);
                    let newHide = document.getElementById('hiddenInput').checked;
                    if ((newColors != maxColors) || (newSlots != maxSlots) || (newHide != doHide)) {
                        maxColors = newColors;
                        maxSlots = newSlots;
                        doHide = newHide;
                        initGame();
                    }
                    window.addEventListener('click', handleMouse);
                },
            });
        }
    }


    if (mX < startX) { clearHighlight(); return; } // Too far left!
    if (mY < startY) { clearHighlight(); return; } // Too far up!

    if ((mX - startX) % sizeX > 50) { clearHighlight(); return; } // Outside the bottle to the right!
    if ((mY - startY) % sizeY > 250) { clearHighlight(); return; } // Outside the bottle to the bottom!

    let bX = Math.floor((mX - startX) / sizeX);
    let bY = Math.floor((mY - startY) / sizeY);
    let bNum = (bY * countX) + bX;
    if (curBall == null) {
        clearHighlight();
        if (bottles[bNum].length > 0) {
            bottles[bNum][bottles[bNum].length - 1].highlight = true;
            curBall = bottles[bNum][bottles[bNum].length - 1];
        }
    } else {
        if (isValidMove(bNum)) {
            let move = [curBall.myBottle, bNum];
            undoList.push(move);
            makeMove(curBall.myBottle, bNum);
            curBall = null;
            resetBallPositions();
        } else {
            clearHighlight();
            if (bottles[bNum].length > 0) {
                bottles[bNum][bottles[bNum].length - 1].highlight = true;
                curBall = bottles[bNum][bottles[bNum].length - 1];
            }
        }
    }
}

function handleKeys(e) {
    if (e.keyCode == 90 && e.ctrlKey) {
        if (undoList.length > 0) {
            let move = undoList.pop();
            clearHighlight();
            curBall = null;
            makeMove(move[1], move[0]);
        }
        return;
    }
}

function makeMove(srcB, tgtB) {
    let bottle = bottles[srcB];
    let ball = bottle.pop();
    ball.myBottle = tgtB;
    ball.atRest = false;
    ball.highlight = false;
    bottles[tgtB].push(ball);
    resetBallPositions();
    revealHiddens();
    saveGame();
}

function revealHiddens() {
    if (!doHide) { return; }
    for (let i = 0; i < bottles.length; i++) {
        if (bottles[i].length > 0) {
            bottles[i][bottles[i].length - 1].hidden = false;
        }
    }
}

function isValidMove(bNum) {
    // If the target bottle is full, the move fails.
    if (bottles[bNum].length == maxSlots) return false;

    // If the bottle is empty, the move succeeds. 
    if (bottles[bNum].length == 0) return true;

    // If the target bottle's top color doesn't match, the move fails.
    if (bottles[bNum][bottles[bNum].length - 1].color != curBall.color) return false;

    // TODO: I'm sure I'm missing something. But anyway, return true!
    return true;
}

function clearHighlight() {
    curBall = null;
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
    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, 960, 960);

    // Draw the game elements
    drawBottles();

    // Draw the UI elements
    drawUI();

    // Blit to the big canvas
    dstctx.fillStyle = bgcolor;
    dstctx.fillRect(0, 0, dstCanvas.width, dstCanvas.height);
    dstctx.drawImage(srcCanvas, 0, 0, srcCanvas.width, srcCanvas.height, screenOffsetX, screenOffsetY, newGameWidth, newGameHeight);
    window.requestAnimationFrame(drawScreen);
}

function drawUI() {
    ctx.fillText('⚙️', 25, 25);
    ctx.fillText('📕', srcCanvas.width - 25, 25);
    ctx.fillText('🔄', 25, srcCanvas.height - 25);
    if (undoList.length > 0) {
        ctx.fillText('↩️', srcCanvas.width - 25, srcCanvas.height - 25);
    }
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
                if (bottle.hidden) {
                    ctx.fillText('⚪', bottle.curX, bottle.curY);
                    ctx.font = '24px serif';
                    ctx.fillText('❓', bottle.curX, bottle.curY);
                    ctx.font = '32px serif';
                } else {
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
    resetBallPositions();
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