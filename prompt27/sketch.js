let canvas;
let connections = [
    [0,1], [1,2], [2,3], [3,4], //thumb
    [0,5], [5,6], [6,7], [7,8], //index
    [0,9], [9,10], [10,11], [11,12], //middle
    [0,13], [13,14], [14,15], [15,16], //ring
    [0,17], [17,18], [18,19], [19,20], //pinky
    [2,5], [5,9], [9,13], [13,17] //mesh
];

let drawedPoints = [];

let redButton = {x:20, y:20, w:50, h:50};
let blueButton = {x:20, y:90, w:50, h:50};
let greenButton = {x:20, y:160, w:50, h:50};
let currentColour = 'white';


let sketch = function(p) {

    p.setup = function() {
        canvas = p.createCanvas(640,360, p.WEBGL);
        canvas.id('canvas')
        canvas.parent('container')
    };

    p.draw = function() {
        p.translate(-p.width/2, -p.height/2);
        p.clear();
        if (!toggle){
            p.background(255);
        }

        p.strokeWeight(15);
        for (let pencil of drawedPoints){
            p.stroke(pencil.colour);
            p.point(pencil.x, pencil.y);
        };

        if (detections != undefined){
            if (detections.multiHandLandmarks != undefined){
                p.drawHands();
                p.drawButtons();
            };
        };
    };

    p.drawHands = function() {
        let positions = [];
        

        for (let i = 0; i < detections.multiHandLandmarks.length; i++){
            p.strokeWeight(8);
            p.stroke(255, 100, 0);
            let landmarks = detections.multiHandLandmarks[i];
            for (let j = 0; j < landmarks.length; j++){
                let x = detections.multiHandLandmarks[i][j].x * 640;
                let y = detections.multiHandLandmarks[i][j].y * 360;
                let z = detections.multiHandLandmarks[i][j].z;
                positions.push({"x":x, "y":y, "z":z});

                p.point(x, y, z+1)
                
            };
            

            if (positions.length != 0) {

                p.stroke(0,0,0)
                p.strokeWeight(3);

                for (let i = 0; i < connections.length; i++){
                    p1 = connections[i][0];
                    p2 = connections[i][1];

                    let x1 = positions[p1].x;
                    let y1 = positions[p1].y;
                    let z1 = positions[p1].z;

                    let x2 = positions[p2].x;
                    let y2 = positions[p2].y;
                    let z2 = positions[p2].z;

                    p.line(x1, y1, z1, x2, y2, z2);
                };
                let thumb = positions[4];
                let index = positions[8];
                let middle = positions[12];
                let thumbIndexDistance = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
                let middleIndexDistance = Math.sqrt(Math.pow(middle.x - index.x, 2) + Math.pow(middle.y - index.y, 2));
                if (thumbIndexDistance < 25){
                    p.selectColour(index.x, index.y);
                };

                if (currentColour != 'white'){
                    if (middleIndexDistance < 20){
                        drawedPoints.push({"x":index.x, "y":index.y, "colour":currentColour});
                        console.log("DRAWWWNNN")
                    };
                };
            };

            positions = [];
        };
    };

    p.drawButtons = function() {

        switch(currentColour){
            case 'red':
                p.stroke(0);
                p.strokeWeight(2);
                p.fill(255,0,0);
                p.rect(redButton.x, redButton.y, redButton.w, redButton.h);
                break
            case 'blue':
                p.stroke(0);
                p.strokeWeight(2);
                p.fill(0,0,255);
                p.rect(blueButton.x, blueButton.y, blueButton.w, blueButton.h);
                break
            case 'green':
                p.stroke(0);
                p.strokeWeight(2);
                p.fill(0,255,0);
                p.rect(greenButton.x, greenButton.y, greenButton.w, greenButton.h);
                break
        };

        p.strokeWeight(0);
        p.fill(255,0,0);
        p.rect(redButton.x, redButton.y, redButton.w, redButton.h);
        p.fill(0,0,255);
        p.rect(blueButton.x, blueButton.y, blueButton.w, blueButton.h);
        p.fill(0,255,0);
        p.rect(greenButton.x, greenButton.y, greenButton.w, greenButton.h);

    };

    p.selectColour = function(x, y) {
        if (x > redButton.x && x < redButton.x + redButton.w && y > redButton.y && y < redButton.y + redButton.h){
            currentColour = 'red';
        }

        else if (x > blueButton.x && x < blueButton.x + blueButton.w && y > blueButton.y && y < blueButton.y + blueButton.h){
            currentColour = 'blue';
        }

        else if (x > greenButton.x && x < greenButton.x + greenButton.w && y > greenButton.y && y < greenButton.y + greenButton.h){
            currentColour = 'green';
        }

        console.log(currentColour);
    };
}
let myp5 = new p5(sketch);

function clearSketch(){
    drawedPoints = [];
}
