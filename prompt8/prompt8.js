// Configuration
const TOTAL_DOTS = 1000000;  // 1 million dots
const DOTS_PER_FRAME = 10000; // Draw this many dots per frame
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const DOT_SIZE = 1;          // Size of each dot
const USE_PATTERNS = true
const USE_CUSTOM = !USE_PATTERNS
const PATTERN_TYPE = 'beach'; // Options: 'spiral', 'wave', 'gradient', 'clusters'

// Variables to track progress
let dotsDrawn = 0;
let colorMode = 0; // 0-4 different color schemes
let pattern;

let skipDefaultColors = false;
let saveCount = 0;

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  background(10); // Almost black background
  
  // Choose a pattern
  pattern = PATTERN_TYPE;
  numColors = 5;
  colorMode = floor(random(numColors)); // 5 different color modes
  
  // Set pixel density to 1 for better performance
  pixelDensity(1);
  
  // No stroke for dots
  noStroke();

  if (window.localStorage) {
    const storedCount = localStorage.getItem('dotArtSaveCount');
    if (storedCount) {
      saveCount = parseInt(storedCount);
    }
  }

  // Create the progress folder if it doesn't exist
  try {
    createFolder('progress');
  } catch (e) {
    console.log('Progress folder likely exists already');
  }
}

function draw() {
  // If all dots are drawn, stop
  if (dotsDrawn >= TOTAL_DOTS) {
    noLoop();
    
    // Display completion message
    fill(255);
    textSize(20);
    textAlign(CENTER, CENTER);
    // text("1,000,000 dots completed!", width/2, height/2);
    return;
  }
  
  // Draw dots in batches for better performance
  for (let i = 0; i < DOTS_PER_FRAME && dotsDrawn < TOTAL_DOTS; i++) {
    let x, y;
    
    if (USE_PATTERNS) {
      // Different dot distribution patterns
      let t = dotsDrawn / TOTAL_DOTS; // Normalized progress
      
      if (pattern === 'spiral') {
        // Spiral pattern
        let angle = t * 1000;
        let radius = t * min(width, height) / 2;
        x = width/2 + cos(angle) * radius;
        y = height/2 + sin(angle) * radius;
      } 
      else if (pattern === 'wave') {
        // Wave pattern
        x = t * width;
        y = height/2 + sin(t * 100) * (height/4);
      }
      else if (pattern === 'gradient') {
        // Density gradient
        x = random(width);
        let density = 1 - (x / width); // Higher density on the left
        y = random(height) * density;
      }
      else if (pattern === 'clusters') {
        // Random clusters
        let cluster = floor(t * 10);
        let clusterX = sin(cluster) * width/2 + width/2;
        let clusterY = cos(cluster) * height/2 + height/2;
        x = clusterX + randomGaussian() * 100;
        y = clusterY + randomGaussian() * 100;
      }
      else if (pattern === 'beach') {
        patches = ['sand', 'water', 'surf', 'board', 'board2', 'waves', 'blocky waves'];
        patch = patches[floor(random(patches.length))];
        
        if (patch === 'sand') {
          // Density gradient
          x = random(width);
          let density = 1 - (x / width); // Higher density on the left
          y = random(height) * density;
        
          fill(135 + random(40), 206 + random(30), 235 + random(20), 255);
        }

        else if (patch === 'water') {

          const A = { x: 0, y: height };
          const B = { x: width, y: height };
          const C = { x: width, y: 0 };
          
          let [x_, y_] = getTrianglePoint(A, B, C);
          
          x = x_;
          y = y_

          fill(255 + random(15), 150 + random(20), 20 + random(30), 255);
      }
      
        //Draw oval in the middle of the screen
      else if (patch == 'board') {
          // Define the ellipse's center and radii for the surf board
          let cx = width / 1.9;
          let cy = height / 2.2;
          let rx = width / 10;
          let ry = height / 20;
          
          // Define a rotation angle in radians (e.g., 45°)
          let angleOffset = radians(120);
          
          // Sample a point uniformly in the ellipse before rotation
          let theta = random(TWO_PI);
          let r = sqrt(random()); // sqrt() gives a uniform distribution in the ellipse
          let dx = r * rx * cos(theta);
          let dy = r * ry * sin(theta);
          
          // Rotate the point by angleOffset
          let rotatedX = dx * cos(angleOffset) - dy * sin(angleOffset);
          let rotatedY = dx * sin(angleOffset) + dy * cos(angleOffset);
          
          // Assign the rotated point to x and y
          x = cx + rotatedX;
          y = cy + rotatedY;
          
          // Set a fill color for the surf board (adjust as needed)
          // fill(255, 130, 255, 255);
          getRandomColour([255, 130, 255, 255], [255, 255, 0, 255], 0.3)
      }

      else if (patch == 'board2') {
        // Define the ellipse's center and radii for the surf board
        let cx = width / 2.02;
        let cy = height / 1.8;
        let rx = width / 40;
        let ry = height / 120;
        
        // Define a rotation angle in radians (e.g., 45°)
        let angleOffset = radians(120);
        
        // Sample a point uniformly in the ellipse before rotation
        let theta = random(TWO_PI);
        let r = sqrt(random()); // sqrt() gives a uniform distribution in the ellipse
        let dx = r * rx * cos(theta);
        let dy = r * ry * sin(theta);
        
        // Rotate the point by angleOffset
        let rotatedX = dx * cos(angleOffset) - dy * sin(angleOffset);
        let rotatedY = dx * sin(angleOffset) + dy * cos(angleOffset);
        
        // Assign the rotated point to x and y
        x = cx + rotatedX;
        y = cy + rotatedY;
        
        // Set a fill color for the surf board (adjust as needed)
        if (random(2) > 1.2) {
          fill(255, 200, 0, 255);
        } else {
          fill(250, 0, 0, 255)
        }
    }

      else if (patch == 'waves') {
        // Choose a random parameter (0 to 1) along the diagonal from bottom left to top right
        let t_wave = random();
        
        // Compute the baseline point along the diagonal
        let bx = lerp(width/2, -width/10, t_wave);
        let by = lerp(height/2, -height/10, t_wave);
        
        // Compute the unit normal vector to the baseline that points toward top left.
        let d = sqrt(sq(width * 0) + sq(height));
        let normalX = (height * 2) / d;
        let normalY = (-width * 0.5) / d;
        
        // Increase the amplitude with t_wave.
        let amplitude = 1000 * t_wave;
        
        // Compute a phase value; here 5 cycles near the bottom decreasing with t_wave.
        let phase = (1 - t_wave) * TWO_PI * 20;
        
        // Use a discrete offset for a more choppy zigzag effect.
        // let offset = amplitude * (random(2) > 1.5 ? -random(0.2) : random(2)) // (sin(phase) >= 0 ? -random(0.2) : random(2));
        // let offset = random(50) + amplitude * (sin(phase) >= 0 ? -random(0.2) : random(2)) * t;
        let offset = amplitude * sin(phase);
        
        // Add the offset to the baseline to determine x,y
        x = bx + normalX * offset;
        y = by + normalY * offset;
        
        // Set a fill color for the waves (adjust as needed)
        fill(255, 255, 255, 200 + random(55));
    }

    else if (patch == 'blocky waves') {
      // Choose a random parameter (0 to 1) along the diagonal from bottom left to top right
      let t_wave = random();
      
      // Compute the baseline point along the diagonal
      let bx = lerp(width/2, -width/10, t_wave);
      let by = lerp(height/2, -height/10, t_wave);
      
      // Compute the unit normal vector to the baseline that points toward top left.
      let d = sqrt(sq(width * 0) + sq(height));
      let normalX = (height * 2) / d;
      let normalY = (-width * 0.5) / d;
      
      // Increase the amplitude with t_wave.
      let amplitude = 200 * t_wave;
      
      // Compute a phase value; here 5 cycles near the bottom decreasing with t_wave.
      let phase = (1 - t_wave) * TWO_PI * 30;
      
      // Use a discrete offset for a more choppy zigzag effect.
      // let offset = amplitude * (random(2) > 1.5 ? -random(0.2) : random(2)) // (sin(phase) >= 0 ? -random(0.2) : random(2));
      let offset = random(50) + amplitude * (sin(phase) >= 0 ? -random(20) : random(20)) * 0.3;
      // let offset = amplitude * sin(phase);
      
      // Add the offset to the baseline to determine x,y
      x = bx + normalX * offset;
      y = by + normalY * offset;
      
      // Set a fill color for the waves (adjust as needed)
      //White
      fill(255, 2, 255, 200 + random(55));
      getRandomColour([255, 0, 255, 255], [255, 0, 0, 255], 1)
        
    }

    else if (patch == 'surf') {
      // Choose a random parameter (0 to 1) along the diagonal from bottom left to top right
      let t_wave = random();
      
      // Compute the baseline point along the diagonal
      let bx = lerp(0, width, t_wave);
      let by = lerp(height, 0, t_wave);
      
      // Compute the unit normal vector to the baseline that points toward top left.
      let d = sqrt(sq(width * 0) + sq(height));
      let normalX = (-height * 2) / d;
      let normalY = (-width * 0.5) / d;
      
      // Increase the amplitude with t_wave.
      let amplitude = 30 * t_wave;
      
      // Compute a phase value; here 5 cycles near the bottom decreasing with t_wave.
      let phase = (1 - t_wave) * TWO_PI * 20;
      
      // Use a discrete offset for a more choppy zigzag effect.
      // let offset = amplitude * (random(2) > 1.5 ? -random(1) : random(2)) // (sin(phase) >= 0 ? -random(0.2) : random(2));
      let offset = amplitude * (sin(phase) >= 0 ? -random(0.5) : random(2)) * random(2) + random(10);
      // let offset = amplitude * sin(phase);
      
      // Add the offset to the baseline to determine x,y
      x = bx + normalX * offset;
      y = by + normalY * offset;
      
      if (sin(phase) >= 0){
        fill(255, 180, 100, 100 + random(55))
      } else {
        fill(255, 255, 255, 255)
      }
  }

    skipDefaultColors = true;
  }
      else {
        // Default to random
        x = random(width);
        y = random(height); 
      }
    }
    
    // Ensure x and y are within canvas bounds
    x = constrain(x, 0, width);
    y = constrain(y, 0, height);
    
    // Color based on position and selected color mode
    if (!skipDefaultColors  ){
      switch(colorMode) {
        case 0: // Grayscale based on position
          fill(map(x, 0, width, 50, 255), map(y, 0, height, 50, 255), 200, 250);
          break;
        case 1: // RGB gradient
          fill(map(x, 0, width, 0, 255), map(y, 0, height, 0, 255), 
              map(dist(x, y, width/2, height/2), 0, width/2, 255, 0), 250);
          break;
        case 2: // Warm colors
          fill(200 + random(55), 100 + random(50), random(50), 250);
          break;
        case 3: // Cool colors
          fill(random(50), 100 + random(50), 200 + random(55), 250);
          break;
        case 4: // Rainbow based on position
          colorMode = HSB;
          fill((x + y + frameCount) % 360, 100, 100, 0.5);
          colorMode = RGB;
          break;
      }
  }


    
    // Draw the dot
    ellipse(x, y, DOT_SIZE, DOT_SIZE);
    
    dotsDrawn++;
  }
  
  let progress = map(dotsDrawn, 0, TOTAL_DOTS, 0, 100);
  dotsDrawn.toLocaleString();

  // Display progress
  // if (frameCount % 10 === 0) {
  // console.log(`Progress: ${progress.toFixed(1)}% - ${dotsDrawn.toLocaleString()} dots`);
  // }
}

function getRandomColour(c1, c2, threshold) {
  if (random(2) > threshold) {
    fill(c1[0], c1[1], c1[2], c1[3]);
  } else {
    fill(c2[0], c2[1], c2[2], c2[3])
  }
}

function getTrianglePoint(A, B, C) {
  // Generate random barycentric coordinates
  let u = random();
  let v = random();
  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }
  
  // Compute the point inside the triangle
  let x_ = A.x + u * (B.x - A.x) + v * (C.x - A.x);
  let y_ = A.y + u * (B.y - A.y) + v * (C.y - A.y);
  
  return [x_, y_];
}

// Handle window resize
function windowResized() {
  // Optionally handle resize if needed
  // resizeCanvas(windowWidth, windowHeight);
}

// Click to change pattern
function mousePressed() {
}

function switchPattern() {
  const patterns = ['spiral', 'wave', 'gradient', 'clusters', 'beach'];
  const patternIndex = patterns.indexOf(pattern);
  pattern = patterns[(patternIndex + 1) % patterns.length];

  if (pattern == 'random') {
    pattern = '';
  }
}

// Add this function to detect keypresses
function keyPressed() {
  print("ran")
  // Check if spacebar is pressed (keyCode 32)
  if (keyCode === 32) {

    // Increment the save counter
    saveCount++;
    
    // Save the current canvas with timestamp and counters
    saveCanvas(`progress/${saveCount}`, 'png');
    
    // Store the updated counter in localStorage for persistence
    if (window.localStorage) {
      localStorage.setItem('dotArtSaveCount', saveCount.toString());
    }

    switchPattern();
    
    // Reset
    background(10);
    dotsDrawn = 0;
    colorMode = (colorMode + 1) % (numColors - 1); // Fixed to use 5 color modes
    console.log(`Pattern: ${pattern}, Color Mode: ${colorMode}`);
    loop();

    
    // Prevent default spacebar behavior (scrolling)
    return false;
  }
}



