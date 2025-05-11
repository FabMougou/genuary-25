let detections = {};
let toggle = false;

const videoElement = document.getElementById('input-video');


function handsInFrame(results) {

    //PROBLEM IS THAT NO LANDMARKS ARE BEING PICKED UP BY THE FEED ON MOBILE
    detections = results;

    if (detections.multiHandLandmarks.length != 0){

    }
};

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence:0.5
});

hands.onResults(handsInFrame);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 360
});
camera.start();

function toggleCamera() {
    if (!toggle){
        videoElement.style.display = 'block';
        toggle = true;
    }
    else {
        videoElement.style.display = 'none';
        toggle = false;
    };
};

