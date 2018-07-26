/** Initialize PJS **/
noStroke();
textAlign(CENTER, CENTER);

/** Variables **/
var scene = 0;
var fonts = {// Pre-loaded fonts for faster execution in draw() loop.
    fdefault: loadFont("Airal", 25),
};
var cam = {// Camera variables
    ht : 0.001,// ht = height, the number of pixels high the camera is from the ground
    gotoHt: 0.033,// Used for the smooth effect when zooming with the mouse scroll
    x: 10,
    y: 10,
    dragForceX: 0,// Used for the smooth effect when panning around the map
    dragForceY: 0,// ^
    minHt: 0.005,// Inwards zoom limit
    maxHt: 1,// Outwards zoom limit
    hw: width/2,// hw = half width of canvas
    hh: height/2,// hh = half height of canvas
};
var vMap = [];// tile map in view


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

var CameraUpdate = function() {
    /* Mouse drag logic */
    if(mouseIsPressed && mouseButton === RIGHT){
        cam.dragForceX = (pmouseX-mouseX)*cam.ht;
        cam.dragForceY = (pmouseY-mouseY)*cam.ht;
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




draw = function() {
    switch (scene) {
        case 0: // main game
            background(255);
            
            break;
        
        case 1:
            
            break;
            
        default:
            println("Scene "+scene+" does not exist!");
    }
};
