/** Initialize PJS **/
var framesPerSecond = 30;
frameRate(framesPerSecond);
noStroke();
textAlign(CENTER, CENTER);
rectMode(LEFT);
imageMode(CENTER);

/** Variables **/
var BigBlock;
var tMap;// stands for "tile map"
var bMap;// stands for "block map", contains indices that point to blocks. This variable is used to determine which blocks to draw without checking if every block is on-screen
var toBeRecycledBMapIndices = [];// if block[i].length===0, put i in this array (to be used by bMap if particle appears)
var blocks = [null,];// array of arrays of blocks and particles
var scene = 0;
var down_keys = Object.create(null);
var fonts = {// Pre-loaded fonts for faster execution in draw() loop.
    fdefault: loadFont("Airal", 25),
};
var cam = {// Camera variables
    ht : 1,// ht = height, the number of pixels high the camera is from the ground
    gotoHt: 0.02,// Used for the smooth effect when zooming with the mouse scroll
    x: 4,
    y: 5,
    dragForceX: 0,// Used for the smooth effect when panning around the map
    dragForceY: 0,// ^
    minHt: 0.002,// Inwards zoom limit
    maxHt: 1,// Outwards zoom limit
    hw: width/2,// hw = half width of canvas
    hh: height/2,// hh = half height of canvas
};
var uint8=(function(){return this.Uint8Array;})();///
var uint16=(function(){return this.Uint16Array;})();///
var mapColumns = 40;
var mapRows = 100;


var mapKeyColors = [
    color(0, 0, 0), // empty
    color(17, 0, 255),// water
    color(138, 50, 50),// lava
    color(34, 255, 0),// grass
    color(122, 79, 9),// earth
    color(219, 219, 219),// white
    ];
    
var physics = {
    gravity : 0.008,/// maybe turn into physics.physics.gravity
    maxGravityOnObject : 0.4, // maximum fall speed of an object, because of "air friction"
    bigBlockXVelocity : 0.1, // X-velocity of falling BigBlocks

};

/** The key:
 * 
 * 0 = Empty (sky/darkness)
 * 1 = Water
 * 2 = 
 * 
 * 
 * 
 * **/


/** Tools (functions) **/
var X = function(cor){// Calculate on-screen position based on camera variables (x, y, height)
    return (cor-cam.x)/cam.ht+cam.hw;
};
var Y = function(cor){
    return (cor-cam.y)/cam.ht+cam.hh;
};
var S = function(size){
    return size/cam.ht;
};
var RevX = function(pos){
    return (pos-cam.hw)*cam.ht+cam.x;
};
var RevY = function(pos){
    return (pos-cam.hh)*cam.ht+cam.y;
};
var RevS = function(size){
    return size*cam.ht;
};

var cameraUpdate = function() {
    /* Mouse drag logic */
    if(mouseIsPressed && mouseButton === RIGHT){
        cam.dragForceX = (pmouseX-mouseX)*cam.ht;
        cam.dragForceY = (pmouseY-mouseY)*cam.ht;/// cam.hw instead?
        cam.x += cam.dragForceX;
        cam.y += cam.dragForceY;
    } else{
        cam.x += cam.dragForceX;
        cam.y += cam.dragForceY;
        cam.dragForceX *= 0.7;
        cam.dragForceY *= 0.7;
    }

    /* Q/A key zoom logic */
    if (down_keys[81] && cam.gotoHt > cam.minHt) {
        cam.gotoHt *= 0.95;
    } else if (down_keys[65] && cam.gotoHt < cam.maxHt) {
        cam.gotoHt /= 0.95;
    }

    /* Smooth zoom logic */
    if(cam.ht < cam.gotoHt/1.01){
        cam.ht += (cam.gotoHt-cam.ht)*0.4;
    }else if(cam.ht > cam.gotoHt*1.01){
        cam.ht -= (cam.ht-cam.gotoHt)*0.4;
    }else{cam.ht = cam.gotoHt;}
};

var collidelib = {
    player_to_map:function(playerObj) {// check 4 nearest blocks for collisions
        var roundedX = round(playerObj.centerX);
        var roundedY = round(playerObj.centerY);// rounded coors are also the BR block coors
        
        var blockTL = tMap[(roundedX-1)+mapColumns*(roundedY-1)];// top-left block
        var blockTR = tMap[(roundedX)+mapColumns*(roundedY-1)];// top-right block
        var blockBL = tMap[(roundedX-1)+mapColumns*(roundedY)];// bottom-left block
        var blockBR = tMap[(roundedX)+mapColumns*(roundedY)];// bottom-right block
        var _isFalling = true;
        /**
        if (blockTL) {// if top-left block is solid
            if (playerObj.x1 < roundedX && playerObj.y1 < roundedY) {
                if (abs(playerObj.x1-(roundedX-0.5)) > abs(playerObj.y1-(roundedY-0.5))) {
                    playerObj.velX = 0;
                    playerObj.x1 = roundedX;
                    playerObj.configXs();
                }
                else {
                    playerObj.velY = 0;
                    playerObj.y1 = roundedY;
                    playerObj.configYs();
                }
            }
        }
        if (blockTR) {// if top-right block is solid
            if (playerObj.y1 < roundedY && playerObj.x2 > roundedX) {
                if (abs(playerObj.x2-(roundedX+0.5)) > abs(playerObj.y1-(roundedY-0.5))) {
                    playerObj.velX = 0;
                    playerObj.x1 = roundedX-playerObj.w;
                    playerObj.configXs();
                } else  {
                    playerObj.velY = 0;
                    playerObj.y1 = roundedY;
                    playerObj.configYs();
                }
            }
        }
        if (blockBL) {// if bottom-left block is solid
            if (playerObj.x1 < roundedX && playerObj.y2 > roundedY) {
                if (abs(playerObj.x1-(roundedX-0.5)) > abs(playerObj.y2-(roundedY+0.5))) { 
                    playerObj.velX = 0;
                    playerObj.x1 = roundedX;
                    playerObj.configXs();
                } else {
                    playerObj.velY = 0;
                    playerObj.y1 = roundedY-playerObj.h;
                    playerObj.configYs();
                    _isFalling = false;
                    playerObj.isFalling = false;
                }
            }            
        }
        if (blockBR) {// if bottom-right block is solid
            if (playerObj.x2 > roundedX && playerObj.y2 > roundedY) {
                if (abs(playerObj.x2-(roundedX+0.5)) > abs(playerObj.y2-(roundedY+0.5))) { 
                    playerObj.velX = 0;
                    playerObj.x1 = roundedX-playerObj.w;
                    playerObj.configXs();
                } else {
                    playerObj.velY = 0;
                    playerObj.y1 = roundedY-playerObj.h;
                    playerObj.configYs();
                    _isFalling = false;
                    playerObj.isFalling = false;
                }        
            }
        }**/
        if (blockTL) {// if top-left block is solid
            if (playerObj.x1 < roundedX && playerObj.y1 < roundedY) {
                if (playerObj.x1-(roundedX-0.5) > playerObj.y1-(roundedY-0.5)) {
                    playerObj.velX = 0;
                    playerObj.x1 = roundedX;
                    playerObj.configXs();
                }
                else {
                    playerObj.velY = 0;
                    playerObj.y1 = roundedY;
                    playerObj.configYs();
                }
            }
        }
        if (blockTR) {// if top-right block is solid
            if (playerObj.y1 < roundedY && playerObj.x2 > roundedX) {
                if ((roundedX+0.5)-playerObj.x2 > playerObj.y1-(roundedY-0.5)) {
                    playerObj.velX = 0;
                    playerObj.x1 = roundedX-playerObj.w;
                    playerObj.configXs();
                } else  {
                    playerObj.velY = 0;
                    playerObj.y1 = roundedY;
                    playerObj.configYs();
                }
            }
        }
        if (blockBL) {// if bottom-left block is solid
            if (playerObj.x1 < roundedX && playerObj.y2 > roundedY) {
                if (playerObj.x1-(roundedX-0.5) > (roundedY+0.5)-playerObj.y2) { 
                    playerObj.velX = 0;
                    playerObj.x1 = roundedX;
                    playerObj.configXs();
                } else {
                    playerObj.velY = 0;
                    playerObj.y1 = roundedY-playerObj.h;
                    playerObj.configYs();
                    _isFalling = false;
                    playerObj.isFalling = false;
                }
            }            
        }
        if (blockBR) {// if bottom-right block is solid
            if (playerObj.x2 > roundedX && playerObj.y2 > roundedY) {
                if ((roundedX+0.5)-playerObj.x2 > (roundedY+0.5)-playerObj.y2) { 
                    playerObj.velX = 0;
                    playerObj.x1 = roundedX-playerObj.w;
                    playerObj.configXs();
                } else {
                    playerObj.velY = 0;
                    playerObj.y1 = roundedY-playerObj.h;
                    playerObj.configYs();
                    _isFalling = false;
                    playerObj.isFalling = false;
                }        
            }
        }
        if (_isFalling) {
            var blockBBX1 = tMap[floor(playerObj.x1)+mapColumns*(roundedY)];// below-left block
            var blockBBX2 = tMap[floor(playerObj.x2)+mapColumns*(roundedY)];// below-right block
            
            if (!blockBBX1 && !blockBBX2) {
                playerObj.isFalling = true;
            }
        }
    },
    
    block_to_map:function(blockObj) {
        var roundedX = round(blockObj.centerX);
        var roundedY = round(blockObj.centerY);// rounded coors are also the BR block coors

        var blockTL = tMap[(roundedX-1)+mapColumns*(roundedY-1)];// top-left block
        var blockTR = tMap[(roundedX)+mapColumns*(roundedY-1)];// top-right block
        var blockBL = tMap[(roundedX-1)+mapColumns*(roundedY)];// bottom-left block
        var blockBR = tMap[(roundedX)+mapColumns*(roundedY)];// bottom-right block
        var _isFalling = true;
         if (blockTL) {// if top-left block is solid
            if (blockObj.x1 < roundedX && blockObj.y1 < roundedY) {
                if (blockObj.x1-(roundedX-0.5) > blockObj.y1-(roundedY-0.5)) {
                    blockObj.velX = 0;
                    blockObj.x1 = roundedX;
                    blockObj.configXs();
                }
                else {
                    blockObj.velY = 0;
                    blockObj.y1 = roundedY;
                    blockObj.configYs();
                }
            }
        }
        if (blockTR) {// if top-right block is solid
            if (blockObj.y1 < roundedY && blockObj.x2 > roundedX) {
                if ((roundedX+0.5)-blockObj.x2 > blockObj.y1-(roundedY-0.5)) {
                    blockObj.velX = 0;
                    blockObj.x1 = roundedX-blockObj.w;
                    blockObj.configXs();
                } else  {
                    blockObj.velY = 0;
                    blockObj.y1 = roundedY;
                    blockObj.configYs();
                }
            }
        }
        if (blockBL) {// if bottom-left block is solid
            if (blockObj.x1 < roundedX && blockObj.y2 > roundedY) {
                if (blockObj.x1-(roundedX-0.5) > (roundedY+0.5)-blockObj.y2) { 
                    blockObj.velX = 0;
                    blockObj.x1 = roundedX;
                    blockObj.configXs();
                } else {
                    blockObj.velY = 0;
                    blockObj.y1 = roundedY-blockObj.h;
                    blockObj.configYs();
                    _isFalling = false;
                    blockObj.isFalling = false;
                }
            }            
        }
        if (blockBR) {// if bottom-right block is solid
            if (blockObj.x2 > roundedX && blockObj.y2 > roundedY) {
                if ((roundedX+0.5)-blockObj.x2 > (roundedY+0.5)-blockObj.y2) { 
                    blockObj.velX = 0;
                    blockObj.x1 = roundedX-blockObj.w;
                    blockObj.configXs();
                } else {
                    blockObj.velY = 0;
                    blockObj.y1 = roundedY-blockObj.h;
                    blockObj.configYs();
                    _isFalling = false;
                    blockObj.isFalling = false;
                }        
            }
        }        if (_isFalling) {
            var blockBBX1 = tMap[floor(blockObj.x1)+mapColumns*roundedY];// below-left block
            var blockBBX2 = tMap[floor(blockObj.x2)+mapColumns*roundedY];// below-right block
            
            if (!blockBBX1 && !blockBBX2) {
                blockObj.isFalling = true;
            }
        }
    },
    
    
    
};

var generateMap = function() {
    
    var tArray = [];
    var bArray = [];
    for (var i = 0; i < mapRows*mapColumns; i ++) {
        if (i%mapColumns===0 || i%mapColumns===mapColumns-1 || floor(i/mapColumns)===0 || floor(i/mapColumns)===mapRows-1) {
            tArray.push(floor(random(1,4.999)));
        } else {
            tArray.push((random(0,1) > 0.8) ? 0 : floor(random(1,4.999)));
        }
        bArray.push(0);
    }
    tMap = uint8.from(tArray);
    bMap = uint16.from(bArray);
    

   
    
    
};

var mapConnectionsScan = function() {
    var tempArray = [];
    for (var i = 0; i < tMap.length; i ++) {
        tempArray.push(false);
    }
    var infectedMap = uint8.from(tempArray);
    
    infectedMap[tMap.length-1] = 1;
    var endpoints = [tMap.length-1];

    var maxTimes = 200;
    var times = 0;
    while (endpoints.length !== 0) {// infect solid tiles
        for (var i = endpoints.length-1; i >= 0; i --) {
            if (endpoints[i]%mapColumns !== 0) {
                var indexLeft = endpoints[i]-1;
                if (tMap[indexLeft] && !infectedMap[indexLeft]) {
                    infectedMap[indexLeft] = true;
                    endpoints.push(indexLeft);
                }
    
            } if (endpoints[i]%mapColumns !== mapColumns-1) {
                var indexRight = endpoints[i]+1;
                if (tMap[indexRight] && !infectedMap[indexRight]) {
                    infectedMap[indexRight] = true;
                    endpoints.push(indexRight);
                }
            }
            if (endpoints[i] >= mapColumns) {
                var indexUp = endpoints[i]-mapColumns;
                if (tMap[indexUp] && !infectedMap[indexUp]) {
                    infectedMap[indexUp] = true;
                    endpoints.push(indexUp);
                }
            } 
            if (endpoints[i] < tMap.length-mapColumns) {
                var indexDown = endpoints[i]+mapColumns;
                if (tMap[indexDown] && !infectedMap[indexDown]) {
                    infectedMap[indexDown] = true;
                    endpoints.push(indexDown);
                }
            }
            
            endpoints.splice(i, 1);
        }
        times ++;
        if (times > maxTimes) {
            break;
        }

    }
    //non-infected tiles turned into particles
    
    var bMapOnIndex = blocks.length;
    for (var i = 0; i < tMap.length; i ++) {
        if (tMap[i]) {
            if (!infectedMap[i]) {
                
                bMap[i] = bMapOnIndex;
                blocks.push( [new BigBlock(i%mapColumns, floor(i/mapColumns), tMap[i], i, bMapOnIndex, 0, random(-physics.bigBlockXVelocity, physics.bigBlockXVelocity))] );
                //                                                                id256, bMapIndex, blockIndex, blockIndexIndex
                
                
                tMap[i] = 0;
                bMapOnIndex ++;
            } else {

                
            }
            
        }
    }
    

    
    
};

var drawTiles = function() {
    for (var layer = max(0, floor(RevY(0))); layer < min(floor(RevY(height))+1, mapRows); layer ++) {
        for (var col = max(0, floor(RevX(0))); col < min(floor(RevX(width ))+1, mapColumns); col ++) {
            fill(mapKeyColors[tMap[layer*mapColumns+col]]);
            rect(X(col), Y(layer), S(1)+0.5, S(1)+0.5);
        }
    }
    
};

var drawBlocks = function() {
    for (var layer = max(0, floor(RevY(0))); layer < min(floor(RevY(height))+1, mapRows); layer ++) {
        for (var col = max(0, floor(RevX(0))); col < min(floor(RevX(width ))+1, mapColumns); col ++) {
            var id65536 = bMap[layer*mapColumns+col];
            if (id65536 !== 0) {
                for (var bi = 0; bi < blocks[id65536].length; bi ++) {
                    blocks[id65536][bi].update();
                }
            }
        }
    }
};

/** Objects (classes) **/
var Framework = function() {
    this.fanAngle = 0;
    this.fanVel = 200;
    this.font = createFont("Arial");
    this.show = false;
    this.millisInit = millis();
    this.framesPast = 0;
    this.chMillis = 0;
    this.measuredFPS = framesPerSecond;
    this.realFPS = framesPerSecond;

    this.onKeyDown = function(theCode) {
        if (theCode === 192){
            this.show = !this.show;
        }
    
    };
    this.drawButton = function(number, fps, posX, posY) {
        if (mouseY > posY && mouseIsPressed && mouseX > posX && mouseX < posX+30 && mouseY < posY+19){
            var pFPS = framesPerSecond;
            framesPerSecond = fps;
            this.realFPS = round(this.realFPS*framesPerSecond/pFPS);//estimate before calculating
            frameRate(this.realFPS);
            this.millisInit = millis();//retest frame rate
            this.framesPast = 0;
            

        }else{
            if (fps === framesPerSecond){
                fill(255, 0, 0);
                rect(posX,posY,30,19);
                text(number,posX+7,posY+16);
                fill(255, 255, 255);                
            }else{
                noFill();
                stroke(255, 255, 255);
                rect(posX,posY,30,19);
            }
        }
        text(number,posX+7,posY+16);
    };
    this.draw = function() {
        if (this.show){
            textAlign(LEFT);
            
            this.fanAngle += this.fanVel/framesPerSecond;//move the fan
            
            fill(0, 0, 0);
            rect(0,height-30,width,30);
            fill(255, 255, 255);
            textFont(this.font, 15);
            text("FPS: "+this.measuredFPS+" / "+this.realFPS,5,height-9);

            arc(width-15,height-15,15,15,this.fanAngle,this.fanAngle+60);//fan thingy
            arc(width-15,height-15,15,15,this.fanAngle+120,this.fanAngle+180);
            arc(width-15,height-15,15,15,this.fanAngle+240,this.fanAngle+300);
            
            stroke(255, 255, 255);
            strokeWeight(1);
            this.drawButton(".5x",15,209,height-25);
            this.drawButton("1x",30,242,height-25);
            this.drawButton("2x",60,275,height-25);
            
            noStroke();
            textAlign(CENTER, CENTER);//reset the mode back to original
            textFont(fonts.fdefault);
        }
    };
    this.adjust = function() {///this is months old, need to update comments
        this.chMillis = millis()-this.millisInit;//difference
        this.framesPast += 1;
        if (this.chMillis > 1000){

            this.measuredFPS = round(this.framesPast*1000/this.chMillis);
            this.millisInit = millis();
            this.framesPast = 0;
            this.realFPS -= floor((this.measuredFPS-framesPerSecond)/2);//calculates a fake frame rate to correct the real frame rate.
            if (this.realFPS < 1) {
                this.realFPS = 10;
            } else if (this.realFPS > 100) {
                this.realFPS = 100;
            }
            frameRate(this.realFPS);
        }
    };
    
    this.main = function() {
        this.adjust();
        this.draw();
    };
};


var Player = function(x, y, w, h) {
    this.x1 = x;
    this.y1 = y;
    this.w = w;// MUST BE LESS THAN (or ==) 0.5
    this.h = h;// MUST BE LESS THAN (or ==) 0.5
    this.centerX = x + w/2;
    this.centerY = y + h/2;
    this.x2 = x + w;
    this.y2 = w + h;
    this.cameraFollowX = x;// where the camera follows
    this.cameraFollowY = y;
    this.cameraTrackAheadAmount = 20;// how many frames ahead the camera predicts you will be *adjusted by camera height
    this.velX = 0;
    this.velY = 0;
    this.speedX = 0.07;
    this.speedY = 0.22;//0.135;
    this.isFalling = true;// if not touching block
    this.collisionPushBack = 0.1;// in a perfect world, it would be exactly 0, but this allows the player to go between walls in this program
    this.avatars = [getImage("creatures/OhNoes-Happy"), getImage("creatures/OhNoes-Hmm"), getImage("creatures/OhNoes"), ];// [normal_avatar, jumping_up_avatar, jumping_down_avatar];
    this.isFacingLeft = true;
    
    this.configXs = function() {
        this.centerX = this.x1 + this.w/2;
        this.x2 = this.x1 + this.w;        
    };
    
    this.configYs = function() {
        this.centerY = this.y1 + this.h/2;
        this.y2 = this.y1 + this.h;
    };
    
    
    this.update = function() {
        /* Movement */
        if (down_keys[LEFT]) {
            this.velX = -this.speedX;
        } else if (down_keys[RIGHT]) {
            this.velX = this.speedX;
        } else {
            this.velX = 0;
        }
        if (down_keys[UP]) {
            if (!this.isFalling) {
                this.upKeyPressed = true;
                this.isFalling = true;
                this.velY = -this.speedY;
            }
        }
                
        
        
        
        
        /* Physics */
        var wasCenterX = this.centerX;
        var wasCenterY = this.centerY;
 
        
        this.x1 += this.velX;
        this.configXs();
        
        
     
        
        
        if (this.isFalling) {
            this.y1 += this.velY;
            this.configYs();
            this.velY = (this.velY < physics.maxGravityOnObject) ? this.velY + physics.gravity : physics.maxGravityOnObject;
        }
        
        
        collidelib.player_to_map(this);// map collisions
   
        

        
        /* Make camera follow player (looks much better if placed after graphics */

        //cam.x=this.centerX;cam.y=this.centerY;
        
        /* Graphics */
        //fill(255, 0, 217);
        //rect(X(this.x1), Y(this.y1), S(this.w), S(this.h));
        
        var avatar = this.avatars[this.isFalling?this.velY>0?2:1:0];
        if (this.isFacingLeft) {
            image(avatar, X(this.centerX), Y(this.centerY), S(this.w*1.3), S(this.h*1.3));
            if (this.velX < 0) {
                this.isFacingLeft = false;
            }
        } else {
            translate(X(this.centerX), Y(this.centerY));
            scale(-1, 1);
            image(avatar, 0, 0, S(this.w*1.3), S(this.h*1.3));
            resetMatrix();
            if (this.velX > 0) {
                this.isFacingLeft = true;
            }
        }
        
        
        this.cameraFollowX = this.centerX+this.velX*this.cameraTrackAheadAmount;
        this.cameraFollowY = this.centerY+this.velY*this.cameraTrackAheadAmount;
        cam.x += (this.cameraFollowX-cam.x)*0.1;
        cam.y += (this.cameraFollowY-cam.y)*0.1;
    };
    
};

var BigBlock = function(x, y, id256, bMapIndex, blockIndex, blockIndexIndex, velX, velY) {// velX and velY are optional parameters
    this.x1 = x;
    this.y1 = y;
    this.w = 1;
    this.h = 1;
    this.velX = (velX === undefined) ? 0 : velX;
    this.velY = (velY === undefined) ? 0 : velY;
    this.isFalling = true;
    this.x2 = x+this.w;
    this.y2 = y+this.h;
    this.centerX = x+this.w/2;
    this.centerY = y+this.w/2;
    this.inRow = floor(this.centerX);
    this.inColumn = floor(this.centerY);
    this.id256 = id256;
    this.bMapIndex = bMapIndex;// set bMap[this.bMapIndex] = 0 when if you are the last block in blocks[blockIndex]
    this.blockIndex = blockIndex;// index in blocks
    this.blockIndexIndex = blockIndexIndex;// index in blocks[this.blockIndex]. This number changes if lower index is removed
    
    this.configXs = function() {
        this.centerX = this.x1 + this.w/2;
        this.x2 = this.x1 + this.w;        
    };
    
    this.configYs = function() {
        this.centerY = this.y1 + this.h/2;
        this.y2 = this.y1 + this.h;
    };
    
    
    this.logicFalling = function() {
        
    };

    
    this.update = function() {
        this.x1 += this.velX;
        this.configXs();
        if (this.isFalling) {
            this.y1 += this.velY;
            this.velY = (this.velY < physics.maxGravityOnObject) ? this.velY + physics.gravity : physics.maxGravityOnObject;
            this.configYs();
        }
        
        collidelib.block_to_map(this);
        
        
        if (this.isFalling) {// if falling
            var changed = false;
            if (floor(this.centerX) !== this.inRow) {
                if (floor(this.centerY) !== this.inColumn) {
                    this.inColumn = floor(this.centerY);
                }
                this.inRow = floor(this.centerX);
                changed = true;
            } else if (floor(this.y1) !== this.inColumn) {
                this.inColumn = floor(this.centerY);
                changed = true;
            }
            
            if (changed) {
                /* Remove from blocks */
                for (var bii = this.blockIndexIndex+1; bii < blocks[this.blockIndex].length; bii ++) {
                    blocks[this.blockIndex][bii].blockIndexIndex --;// push backwards index
                }
                blocks[this.blockIndex].splice(this.blockIndexIndex, 1);//remove from blocks
                
                /* Remove from bMap (if you're the last of blocks[this.blockIndex]) */
                if (blocks[this.blockIndex].length === 0) {
                    bMap[this.bMapIndex] = 0;
                    toBeRecycledBMapIndices.push(this.blockIndex);///wait don't do this if the block won't die
                }
                
                /* Add to bMap and blocks */
                this.bMapIndex = this.inRow+mapColumns*this.inColumn;
                if (bMap[this.bMapIndex] === 0) {
                    /* Location does not exist, create new one */
                    if (toBeRecycledBMapIndices.length !== 0) {
                        this.blockIndex = toBeRecycledBMapIndices.splice(0, 1)[0];// .splice returns an array of deleted items, even if I delete 1 item
                        bMap[this.bMapIndex] = this.blockIndex;
                        blocks[this.blockIndex] = [this];
                    } else {
                        this.blockIndex = blocks.length;
                        bMap[this.bMapIndex] = this.blockIndex;
                        blocks.push([this]);
                    }
                    this.blockIndexIndex = 0;
                } else {
                    /* Location does exist, push to array */
                    this.blockIndex = bMap[this.bMapIndex];
                    blocks[this.blockIndex].push(this);
                    this.blockIndexIndex = blocks[this.blockIndex].length-1;
                }
            }
            
        } else {// if not falling
            /* Remove from blocks */
            for (var bii = this.blockIndexIndex+1; bii < blocks[this.blockIndex].length; bii ++) {
                blocks[this.blockIndex][bii].blockIndexIndex --;// push backwards index
            }
            blocks[this.blockIndex].splice(this.blockIndexIndex, 1);//remove from blocks
            
            /* Remove from bMap (if you're the last of blocks[this.blockIndex]) */
            if (blocks[this.blockIndex].length === 0) {
                bMap[this.bMapIndex] = 0;
                toBeRecycledBMapIndices.push(this.blockIndex);///wait don't do this if the block won't die
            }
            
            /* Add to tMap */
            this.inRow = floor(this.centerX);
            this.inColumn = floor(this.centerY);
            while (tMap[this.inRow+mapColumns*this.inColumn]) {
                
                this.inColumn --;
            }
            tMap[this.inRow+mapColumns*this.inColumn] = this.id256;
        }
        
        
        
        
        this.draw();///temporary
    };
    
    this.draw = function() {
        fill(mapKeyColors[this.id256]);
        rect(X(this.x1), Y(this.y1), S(this.w), S(this.h));
    };
    
};

/** Create instances **/
var framework = new Framework();
var player = new Player(mapColumns/2, 2, 0.8, 0.8);
generateMap();

///mapConnectionsScan();

/** Built-in functions **/
mouseScrolled = function () {// Got great feedback from KWC@MKaelin368 to improve the scrolling method
    try {
        var evt = mouseScrolled.caller.arguments[0];
        if (typeof evt.preventDefault === "function") {
          // W3 Interface
          evt.preventDefault();
        }
        else { // IE's Interface
          evt.returnValue = !1;
        }
    }
    catch(err) {}
    finally  {
        if (mouseScroll < 0) {
            if (cam.gotoHt < cam.maxHt) {
                cam.gotoHt /= 0.7;
                if (cam.gotoHt > cam.maxHt) {
                    cam.gotoHt = cam.maxHt;
                }
            }
        } else {
            if (cam.gotoHt > cam.minHt) {
                cam.gotoHt *= 0.7;
                if (cam.gotoHt < cam.minHt) {
                    cam.gotoHt = cam.minHt;
                }
            }
        }
    }
};

keyPressed = function() {
    down_keys[keyCode] = true;
    framework.onKeyDown(keyCode);
    //player.onKeyDown(keyCode);
    
    
    ///
    if (key.toString() === "s") {
        mapConnectionsScan();
    }
};

keyReleased = function() {
    down_keys[keyCode] = false;
    //player.onKeyUp(keyCode);
};

draw = function() {
    switch (scene) {
        case 0: // main game
            cameraUpdate();
            
            background(0);
            
            drawTiles();
            drawBlocks();
            
            player.update();
            
            
            break;
        
        case 1:
            
            break;
            
        default:
            println("Scene "+scene+" does not exist!");
    }
    framework.adjust();///change to framework.update
    framework.draw();
    
    /*///
    _clearLogs();
    for (var i = 0; i < mapRows; i ++) {
        var s = "";
        for (var j = 0; j < mapColumns; j ++) {
            var ss = bMap[j+mapColumns*i].toString();
            if (ss.length === 1) {
                s += ss+"  ";
            } else {
                s +=ss+" ";
            }
        }
        println(s);
    }**/
    ///
    if (mouseIsPressed) {
    tMap[floor(RevY(mouseY))*mapColumns+floor(RevX(mouseX))]=0;}
};
