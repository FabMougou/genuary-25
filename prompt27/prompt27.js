// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('webgl-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

// Add orbit controls for mouse interaction
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = false; // Disable mouse controls since we're using hands

// Create a group to hold the wireframe and points
const objectGroup = new THREE.Group();
scene.add(objectGroup);

// Create hand tracking visualization
const handCanvas = document.createElement('canvas');
handCanvas.style.position = 'absolute';
handCanvas.style.top = '0';
handCanvas.style.left = '0';
handCanvas.style.zIndex = '2';
handCanvas.style.pointerEvents = 'none';
document.body.appendChild(handCanvas);
const handCtx = handCanvas.getContext('2d');

// Set up hand canvas size
function updateHandCanvasSize() {
    handCanvas.width = window.innerWidth;
    handCanvas.height = window.innerHeight;
}
updateHandCanvasSize();

// Rotation momentum variables
let rotationVelocity = { x: 0, y: 0 };
const rotationDamping = 0.95; // How quickly the rotation slows down
const maxRotationSpeed = 0.02; // Maximum rotation speed

// Function to find vertices at a specific distance
function findVerticesAtDistance(vertices, degree) {
    const indices = [];
    const numVertices = vertices.length / 3;
    
    // For each vertex
    for (let i = 0; i < numVertices; i++) {
        // Find all vertices that are exactly 'degree' steps away
        for (let j = 0; j < numVertices; j++) {
            if (i !== j) {
                // Calculate the minimum number of steps between vertices
                const steps = calculateMinSteps(i, j);
                if (steps === degree) {
                    indices.push(i, j);
                }
            }
        }
    }
    return indices;
}

// Function to calculate minimum steps between two vertices
function calculateMinSteps(v1, v2) {
    // Get the coordinates of both vertices
    const x1 = vertices[v1 * 3];
    const y1 = vertices[v1 * 3 + 1];
    const z1 = vertices[v1 * 3 + 2];
    const x2 = vertices[v2 * 3];
    const y2 = vertices[v2 * 3 + 1];
    const z2 = vertices[v2 * 3 + 2];
    
    // Calculate the number of different coordinates
    let diffCount = 0;
    if (x1 !== x2) diffCount++;
    if (y1 !== y2) diffCount++;
    if (z1 !== z2) diffCount++;
    
    return diffCount;
}

// Create hexagonal vertices
const vertices = new Float32Array([
    // Top hexagon
    0.5, 0.5, 0.5,    // 0
    0.0, 0.5, 0.5,    // 1
    -0.5, 0.5, 0.5,   // 2
    -0.5, 0.5, 0.0,   // 3
    -0.5, 0.5, -0.5,  // 4
    0.0, 0.5, -0.5,   // 5
    0.5, 0.5, -0.5,   // 6
    0.5, 0.5, 0.0,    // 7
    
    // Bottom hexagon
    0.5, -0.5, 0.5,   // 8
    0.0, -0.5, 0.5,   // 9
    -0.5, -0.5, 0.5,  // 10
    -0.5, -0.5, 0.0,  // 11
    -0.5, -0.5, -0.5, // 12
    0.0, -0.5, -0.5,  // 13
    0.5, -0.5, -0.5,  // 14
    0.5, -0.5, 0.0,   // 15
    
    // Middle points
    0.5, 0.0, 0.5,    // 16
    0.0, 0.0, 0.5,    // 17
    -0.5, 0.0, 0.5,   // 18
    -0.5, 0.0, 0.0,   // 19
    -0.5, 0.0, -0.5,  // 20
    0.0, 0.0, -0.5,   // 21
    0.5, 0.0, -0.5,   // 22
    0.5, 0.0, 0.0     // 23
]);

// Scale the vertices to make the shape more visible
for (let i = 0; i < vertices.length; i++) {
    vertices[i] *= 0.8;
}

// Create custom geometry
const geometry = new THREE.BufferGeometry();

// Create indices for the desired degree of separation
const degree = 2; // Change this to adjust the degree of separation
const indices = findVerticesAtDistance(vertices, degree);

geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
geometry.setIndex(indices);

// Create wireframe material
const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const wireframe = new THREE.LineSegments(geometry, material);
objectGroup.add(wireframe);

// Add vertex points
const pointGeometry = new THREE.BufferGeometry();
pointGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
const pointMaterial = new THREE.PointsMaterial({ 
    color: 0xff0000,
    size: 0.05,
    sizeAttenuation: true
});
const points = new THREE.Points(pointGeometry, pointMaterial);
objectGroup.add(points);

// Function to update colors based on zoom level
function updateColors(zoom) {
    // Calculate color transition based on zoom level
    const t = (zoom - minZoom) / (maxZoom - minZoom); // 0 to 1
    
    // Wireframe color: green (0x00ff00) to cyan (0x00ffff)
    const wireframeColor = new THREE.Color();
    wireframeColor.setHSL(0.33 + t * 0.17, 1, 0.5); // Hue from 0.33 (green) to 0.5 (cyan)
    material.color.copy(wireframeColor);
    
    // Points color: red (0xff0000) to magenta (0xff00ff)
    const pointsColor = new THREE.Color();
    pointsColor.setHSL(t * 0.17, 1, 0.5); // Hue from 0 (red) to 0.17 (magenta)
    pointMaterial.color.copy(pointsColor);
}

// Position camera
camera.position.z = 2;

// Set up MediaPipe Hands
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// Set up webcam
const webcam = new Camera(document.getElementById('input-video'), {
    onFrame: async () => {
        await hands.send({image: document.getElementById('input-video')});
    },
    width: 1280,
    height: 720
});

// Variables for hand tracking
let lastHandPosition = null;
let lastPinchDistance = null;
const minZoom = 0.5;
const maxZoom = 2;
let currentZoom = 1;

// Function to draw hand tracking visualization
function drawHandTracking(hand, isRotationMode) {
    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
    
    // Draw index finger tip (flip the x coordinate to match the camera)
    const indexFinger = hand[8];
    handCtx.beginPath();
    handCtx.arc(
        (1 - indexFinger.x) * handCanvas.width, // Flip x coordinate
        indexFinger.y * handCanvas.height,
        10,
        0,
        Math.PI * 2
    );
    handCtx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    handCtx.fill();
    
    // Draw middle finger tip
    const middleFinger = hand[12];
    handCtx.beginPath();
    handCtx.arc(
        (1 - middleFinger.x) * handCanvas.width,
        middleFinger.y * handCanvas.height,
        10,
        0,
        Math.PI * 2
    );
    handCtx.fillStyle = isRotationMode ? 'rgba(0, 0, 255, 0.5)' : 'rgba(0, 0, 255, 0.2)';
    handCtx.fill();
    
    // Draw thumb tip (flip the x coordinate to match the camera)
    const thumb = hand[4];
    handCtx.beginPath();
    handCtx.arc(
        (1 - thumb.x) * handCanvas.width, // Flip x coordinate
        thumb.y * handCanvas.height,
        10,
        0,
        Math.PI * 2
    );
    handCtx.fillStyle = isRotationMode ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.5)';
    handCtx.fill();
    
    // Draw line between thumb and index
    handCtx.beginPath();
    handCtx.moveTo((1 - thumb.x) * handCanvas.width, thumb.y * handCanvas.height);
    handCtx.lineTo((1 - indexFinger.x) * handCanvas.width, indexFinger.y * handCanvas.height);
    handCtx.strokeStyle = isRotationMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)';
    handCtx.stroke();
    
    // Draw line between index and middle fingers
    handCtx.beginPath();
    handCtx.moveTo((1 - indexFinger.x) * handCanvas.width, indexFinger.y * handCanvas.height);
    handCtx.lineTo((1 - middleFinger.x) * handCanvas.width, middleFinger.y * handCanvas.height);
    handCtx.strokeStyle = isRotationMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)';
    handCtx.stroke();
}

// Handle hand tracking results
hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const hand = results.multiHandLandmarks[0];
        
        // Get finger positions
        const indexFinger = hand[8];
        const middleFinger = hand[12];
        const thumb = hand[4];
        
        // Calculate hand position relative to screen
        const x = (indexFinger.x - 0.5) * 2; // -1 to 1
        const y = (indexFinger.y - 0.5) * -2; // -1 to 1 (inverted)
        
        // Calculate distance between index and middle fingers
        const fingerDistance = Math.hypot(
            middleFinger.x - indexFinger.x,
            middleFinger.y - indexFinger.y
        );
        const isRotationMode = fingerDistance < 0.1;
        
        // Calculate pinch distance for zoom
        const pinchDistance = Math.hypot(
            thumb.x - indexFinger.x,
            thumb.y - indexFinger.y
        );
        
        // Draw hand tracking visualization
        drawHandTracking(hand, isRotationMode);
        
        if (lastHandPosition) {
            if (isRotationMode) {
                // Calculate rotation based on hand movement
                const deltaX = x - lastHandPosition.x;
                const deltaY = y - lastHandPosition.y;
                
                // Update rotation velocity
                rotationVelocity.x += deltaY * 2;
                rotationVelocity.y += deltaX * 2;
                
                // Clamp rotation velocity
                rotationVelocity.x = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, rotationVelocity.x));
                rotationVelocity.y = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, rotationVelocity.y));
            } else {
                // Handle zoom only when not in rotation mode
                if (lastPinchDistance !== null) {
                    const zoomDelta = (pinchDistance - lastPinchDistance) * 5;
                    currentZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom - zoomDelta));
                    objectGroup.scale.set(currentZoom, currentZoom, currentZoom);
                    // Update colors based on new zoom level
                    updateColors(currentZoom);
                }
            }
        }
        
        lastHandPosition = { x, y };
        lastPinchDistance = pinchDistance;
    } else {
        lastHandPosition = null;
        lastPinchDistance = null;
        // Clear hand tracking visualization
        handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
    }
});

// Initialize colors
updateColors(currentZoom);

// Start the webcam
webcam.start();

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateHandCanvasSize();
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Apply rotation momentum
    objectGroup.rotation.x += rotationVelocity.x;
    objectGroup.rotation.y += rotationVelocity.y;
    
    // Apply damping to rotation velocity
    rotationVelocity.x *= rotationDamping;
    rotationVelocity.y *= rotationDamping;
    
    // Limit vertical rotation
    objectGroup.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, objectGroup.rotation.x));
    
    renderer.render(scene, camera);
}

animate();
