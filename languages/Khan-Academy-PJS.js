/** Initialize PJS **/
var framesPerSecond = 30;
frameRate(framesPerSecond);
noStroke();
textAlign(CENTER, CENTER);
rectMode(LEFT);
imageMode(CENTER);

/** Variables **/
var vMap;
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
var vMapColumns = 40;
var vMapRows = 40;


var mapKeyColors = [
    color(0, 0, 0), // empty
    color(17, 0, 255),// water
    color(138, 50, 50),// lava
    color(34, 255, 0),// grass
    color(122, 79, 9),// earth
    color(219, 219, 219),// white
    ];
    
var gravity = 0.008;/// maybe turn into physics.gravity
var maxGravityOnObject = 0.4; // maximum fall speed of an object, because of "air friction"

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
        
        var blockTL = vMap[(roundedX-1)+vMapColumns*(roundedY-1)];// top-left block
        var blockTR = vMap[(roundedX)+vMapColumns*(roundedY-1)];// top-right block
        var blockBL = vMap[(roundedX-1)+vMapColumns*(roundedY)];// bottom-left block
        var blockBR = vMap[(roundedX)+vMapColumns*(roundedY)];// bottom-right block
        var _isFalling = true;
        
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
        }
        
        if (_isFalling) {
            var blockBBL = vMap[(roundedX-1)+vMapColumns*(roundedY)];// below-left block
            var blockBBR = vMap[(roundedX)+vMapColumns*(roundedY)];// below-right block
            
            if (!blockBBL) {
                if (!blockBBR) {// both sides are empty
                    playerObj.isFalling = true;
                } else if (playerObj.x2 <= roundedX) {
                    playerObj.isFalling = true;
                }
            } else {
                if (playerObj.x1 >= roundedX) {
                    playerObj.isFalling = true;
                }
            }
        }

        
    }
    
    
    
};

var generateMap = function() {
    
    var array = [];
    for (var i = 0; i < vMapRows*vMapColumns; i ++) {
        if (i%40===0 || i%40===39 || floor(i/40)===0 || floor(i/40)===39) {
            array.push(floor(random(1,4.999)));
            
        } else {
            array.push((random(0,1) > 0.5) ? 0 : floor(random(1,4.999)));
        }
    }
    vMap = uint8.from(array);

    

   
    
    
};

var mapConnectionsScan = function() {
    var tempArray = [];
    for (var i = 0; i < vMap.length; i ++) {
        tempArray.push(false);
    }
    var infectedMap = uint8.from(tempArray);
    
    infectedMap[vMap.length-1] = 1;
    var endpoints = [vMap.length-1];

    var maxTimes = 200;
    var times = 0;
    while (endpoints.length !== 0) {// infect solid tiles
        for (var i = endpoints.length-1; i >= 0; i --) {
            if (endpoints[i]%vMapColumns !== 0) {
                var indexLeft = endpoints[i]-1;
                if (vMap[indexLeft] && !infectedMap[indexLeft]) {
                    infectedMap[indexLeft] = true;
                    endpoints.push(indexLeft);
                }
    
            } if (endpoints[i]%vMapColumns !== vMapColumns-1) {
                var indexRight = endpoints[i]+1;
                if (vMap[indexRight] && !infectedMap[indexRight]) {
                    infectedMap[indexRight] = true;
                    endpoints.push(indexRight);
                }
            }
            if (endpoints[i] >= vMapColumns) {
                var indexUp = endpoints[i]-vMapColumns;
                if (vMap[indexUp] && !infectedMap[indexUp]) {
                    infectedMap[indexUp] = true;
                    endpoints.push(indexUp);
                }
            } 
            if (endpoints[i] < vMap.length-vMapColumns) {
                var indexDown = endpoints[i]+vMapColumns;
                if (vMap[indexDown] && !infectedMap[indexDown]) {
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
    
    for (var i = 0; i < vMap.length; i ++) {
        if (vMap[i]) {
            if (!infectedMap[i]) {
                vMap[i] = 0;
            }
            
        }
    }
    

    
    
};

var drawTiles = function() {
    var ts = cam.hw/cam.ht;
    for (var layer = max(0, floor(RevY(0))); layer < min(floor(RevY(height))+1, vMapRows); layer ++) {
        for (var col = max(0, floor(RevX(0))); col < min(floor(RevX(width ))+1, vMapColumns); col ++) {
            fill(mapKeyColors[vMap[layer*vMapColumns+col]]);
            rect(X(col), Y(layer), S(1)+0.5, S(1)+0.5);
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
    this.w = w;
    this.h = h;
    this.centerX = x + w/2;
    this.centerY = y + h/2;
    this.x2 = x + w;
    this.y2 = w + h;
    this.cameraFollowX = x;// where the camera follows
    this.cameraFollowY = y;
    this.cameraTrackAheadAmount = 20;// how many frames ahead the camera predicts you will be *adjusted by camera height
    this.velX = 0;
    this.velY = 0;
    this.speedX = 0.04;
    this.speedY = 0.125;
    this.isFalling = true;// if not touching block
    this.collisionPushBack = 0.1;// in a perfect world, it would be exactly 0, but this allows the player to go between walls in this program
    this.avatar = getImage("creatures/OhNoes");
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
            this.velY = (this.velY < maxGravityOnObject) ? this.velY + gravity : maxGravityOnObject;
        }
        
        
        collidelib.player_to_map(this);// map collisions
   
        

        
        /* Make camera follow player */
        /*this.cameraFollowX = this.x+this.velX*this.cameraTrackAheadAmount;
        this.cameraFollowY = this.y+this.velY*this.cameraTrackAheadAmount;
        cam.x += (this.cameraFollowX-cam.x)*0.1;
        cam.y += (this.cameraFollowY-cam.y)*0.1;*/
        cam.x=this.centerX;cam.y=this.centerY;
        
        /* Graphics */
        //fill(255, 0, 217);
        //rect(X(this.x1), Y(this.y1), S(this.w), S(this.h));
        
        
        if (this.isFacingLeft) {
            image(this.avatar, X(this.centerX), Y(this.centerY), S(this.w*1.3), S(this.h*1.3));
            if (this.velX < 0) {
                this.isFacingLeft = false;
            }
        } else {
            translate(X(this.centerX), Y(this.centerY));
            scale(-1, 1);
            image(this.avatar, 0, 0, S(this.w*1.3), S(this.h*1.3));
            resetMatrix();
            if (this.velX > 0) {
                this.isFacingLeft = true;
            }
        }
    };
    
};

var BigBlock = function(x, y, id256) {
    this.x1 = x;
    this.y1 = y;
    this.w = 1;
    this.h = 1;
    this.x2 = x+this.w;
    this.y2 = y+this.h;
    this.id256 = id256;
    
    this.update = function() {
        
    };
    
    this.draw = function() {
        fill(mapKeyColors[this.id256]);
        rect(X(this.x1), Y(this.y1), S(this.w), S(this.h));
    };
    
};

/** Create instances **/
var framework = new Framework();
var player = new Player(vMapRows/2, vMapColumns/2, 0.2, 0.2);
generateMap();

mapConnectionsScan();

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
};

keyReleased = function() {
    down_keys[keyCode] = false;
    //player.onKeyUp(keyCode);
};

draw = function() {
    switch (scene) {
        case 0: // main game
            cameraUpdate();
            
            background(255);
            
            drawTiles();
            
            player.update();
            
            
            break;
        
        case 1:
            
            break;
            
        default:
            println("Scene "+scene+" does not exist!");
    }
    framework.adjust();///change to framework.update
    framework.draw();
};
