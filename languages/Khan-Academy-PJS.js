/** Initialize PJS **/
var framesPerSecond = 30;
frameRate(framesPerSecond);
noStroke();
textAlign(CENTER, CENTER);
rectMode(LEFT);

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
    minHt: 0.01,// Inwards zoom limit
    maxHt: 1,// Outwards zoom limit
    hw: width/2,// hw = half width of canvas
    hh: height/2,// hh = half height of canvas
};
var uint8=(function(){return this.Uint8Array;})();///
var vMapColumns = 20;
var vMapRows; //determined after generateMap is called


var mapKeyColors = [
    color(0, 0, 0), // empty
    color(17, 0, 255),// water
    color(138, 50, 50),// lava
    color(34, 255, 0),// grass
    color(122, 79, 9),// earth
    ];
    
var gravity = 0.0055;/// maybe turn into physics.gravity
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

    /* UP/DOWN arrow key zoom logic *//*
    if (keys[UP] && cam.gotoHt > cam.minHt) {
        cam.gotoHt *= 0.95;
    } else if (keys[DOWN] && cam.gotoHt < cam.maxHt) {
        cam.gotoHt /= 0.95;
    }
*/
    /* Smooth zoom logic */
    if(cam.ht < cam.gotoHt/1.01){
        cam.ht += (cam.gotoHt-cam.ht)*0.4;
    }else if(cam.ht > cam.gotoHt*1.01){
        cam.ht -= (cam.ht-cam.gotoHt)*0.4;
    }else{cam.ht = cam.gotoHt;}
};

var generateMap = function() {
    
    var array = [];
    for (var i = 0; i < 400; i ++) {
        if (random(0,1) < 0.6) {
            array.push(0);
        } else {
            array.push(floor(random(1,4.999)));
        }
    }
    vMap = uint8.from(array);
    
    vMapRows = floor(vMap.length/vMapColumns);
    

   
    
    
};

var drawTiles = function() {
    var ts = cam.hw/cam.ht;
    for (var layer = max(0, floor(RevY(0))); layer < min(floor(RevY(height))+1, vMapRows-1); layer ++) {
        for (var col = max(0, floor(RevX(0))); col < min(floor(RevX(width ))+1, vMapColumns-1); col ++) {
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
    this.speedX = 0.1;
    this.speedY = 0.15;
    this.isFalling = true;// if not touching block
    this.collisionPushBack = 0.1;// in a perfect world, it would be exactly 0, but this allows the player to go between walls in this program
    
    this.onKeyDown = function(theCode) {
        if (theCode === UP) {
            if (!this.isFalling) {
                this.upKeyPressed = true;
                this.isFalling = true;
                this.velY = -this.speedY;
                
            }
        } else if (theCode === DOWN) {
            
        } else if (theCode === LEFT) {
            this.velX = -this.speedX;
        } else if (theCode === RIGHT) {
            this.velX = this.speedX;
        }
        
    };
    
    this.onKeyUp = function(theCode) {
        if (theCode === UP) {
            this.upKeyPressed = false;
            
        } else if (theCode === LEFT || theCode === RIGHT) {
            this.velX = 0;
        }
    };
    
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
        
        /* Tile collisions */
        var onBlockIndexTL = vMap[floor(this.x1)+vMapColumns*floor(this.y1)];// top-left
        if (onBlockIndexTL) {// top-left side of player///enable allllllllllllll///wii
            var blockX = floor(this.x1)+0.5;
            var blockY = floor(this.y1)+0.5;
            if (abs(wasCenterX-blockX) > (abs(wasCenterY-blockY))) {///-1
                this.velX = 0;
                this.x1 = ceil(this.x1)+this.collisionPushBack; 
                this.configXs();
            } else {
                this.velY = 0;
                this.y1 = ceil(this.y1)+this.collisionPushBack; 
                this.configYs();
            }
        } 
        var onBlockIndexTR = vMap[floor(this.x2)+vMapColumns*floor(this.y1)];// top-right
        if (onBlockIndexTR) {// right side of player
            var blockX = floor(this.x2)+0.5;
            var blockY = floor(this.y1)+0.5;
            if (abs(wasCenterX-blockX) > abs(wasCenterY-blockY)) {
                this.velX = 0;
                this.x1 = floor(this.x2)-this.w-this.collisionPushBack; 
                this.configXs();
            } else {
                this.velY = 0;
                this.y1 = ceil(this.y1)+this.collisionPushBack; 
                this.configYs();
            }
        } 
        var onBlockIndexBR = vMap[floor(this.x2)+vMapColumns*floor(this.y2)];// bottom-right
        
        if (onBlockIndexBR) {// bottom-right of player
            var blockX = floor(this.x2)+0.5;
            var blockY = floor(this.y2)+0.5;
            if (abs(wasCenterX-blockX) > abs(wasCenterY-blockY)) {
                this.velX = 0;
                this.x1 = floor(this.x2)-this.w-this.collisionPushBack; 
                this.configXs();
            } else {
                this.isFalling = false;
                this.velY = 0;
                this.y1 = floor(this.y2)-this.h-this.collisionPushBack; ///wait why am I referencing y2 instead of y1
                this.configYs();
            }
        } 
        var onBlockIndexBL = vMap[floor(this.x1)+vMapColumns*floor(this.y2)];// bottom-left
        if (onBlockIndexBL) {// bottom-left side of player///collides TWICEOHHHH
            var blockX = floor(this.x1)+0.5;
            var blockY = floor(this.y2)+0.5;
            if (abs(wasCenterX-blockX) > abs(wasCenterY-blockY)) {
                this.velX = 0;
                this.x1 = ceil(this.x1)+this.collisionPushBack; 
                this.configXs();
            } else {
                this.isFalling = false;
                this.velY = 0;
                this.y1 = floor(this.y2)-this.h-this.collisionPushBack; 
            }
        }

        
        if (!this.isFalling) {
            var belowBlockIndexL = vMap[floor(this.x1)+vMapColumns*floor(this.y2+0.5)];// block below you (left side)
            var belowBlockIndexR = vMap[floor(this.x2)+vMapColumns*floor(this.y2+0.5)];// block below you (right side)
            if (!belowBlockIndexL && !belowBlockIndexR) {
                 this.isFalling = true;
            }
        }
        
        
        /*2* Top-left corner */
        
        
        
        /* UP key press logic 
        if (!this.isFalling && this.upKeyPressed) {
            this.isFalling = true;
            this.velY = -this.speedY;
        }*/

        
        /* Make camera follow player */
        /*this.cameraFollowX = this.x+this.velX*this.cameraTrackAheadAmount;
        this.cameraFollowY = this.y+this.velY*this.cameraTrackAheadAmount;
        cam.x += (this.cameraFollowX-cam.x)*0.1;
        cam.y += (this.cameraFollowY-cam.y)*0.1;*/
        cam.x=this.centerX;cam.y=this.centerY;
        
        /* Graphics */
        fill(255, 0, 217);
        rect(X(this.x1), Y(this.y1), S(this.w), S(this.h));
    };
    
};

/** Create instances **/
var framework = new Framework();
var player = new Player(5.5, 5, 0.5, 0.5);
generateMap();

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
