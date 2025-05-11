// Configuration
const TOTAL_DOTS = 1000000; // 1 million dots (change this to desired amount)
const SQUARE_SIZE = 3000; // Size of the square in pixels
const DOT_SIZE = 2; // Size of each dot
const DOT_COLOR = 255; // White dots by default

// Image URLs - you can add more to this array
const IMAGE_URLS = [
  'image.png', // Local image
  'https://picsum.photos/800/800', // Random image from Lorem Picsum
  'https://images.unsplash.com/photo-1682687982501-1e58ab814714', // Unsplash image
  'https://source.unsplash.com/random/800x800', // Random Unsplash
];

// Variables
let maskGraphics; // The pre-rendered dot mask
let imageGraphics; // The image layer
let compositeGraphics; // The final composite (image seen through mask)
let currentImage;
let currentImageIndex = 0;
let imageLoaded = false;
let maskGenerated = false;
let loadingProgress = 0;
let statusElement;

function updateStatus(message) {
  console.log(message);
  if (statusElement) {
    statusElement.textContent = message;
  }
}

function setup() {
  updateStatus("Setting up...");
  
  // Create canvas with fixed size for the square
  createCanvas(SQUARE_SIZE, SQUARE_SIZE);
  background(0);
  
  // Get status element
  statusElement = document.getElementById('statusDisplay');
  
  // Create graphics buffers for compositing with proper pixel density
  maskGraphics = createGraphics(SQUARE_SIZE, SQUARE_SIZE);
  imageGraphics = createGraphics(SQUARE_SIZE, SQUARE_SIZE);
  compositeGraphics = createGraphics(SQUARE_SIZE, SQUARE_SIZE);
  
  // Set proper pixel density for all graphics objects
  pixelDensity(1);
  maskGraphics.pixelDensity(1);
  imageGraphics.pixelDensity(1);
  compositeGraphics.pixelDensity(1);
  
  // Set up event listeners for buttons
  document.getElementById('saveButton').addEventListener('click', saveImage);
  document.getElementById('changeImageButton').addEventListener('click', changeImage);
  document.getElementById('loadCustom').addEventListener('click', loadCustomImage);
  
  // Start generating the dot mask
  updateStatus("Generating dot mask...");
  generateDotMask();
  
  // Load the first image
  updateStatus(`Loading initial image from: ${IMAGE_URLS[currentImageIndex]}`);
  loadImageFromUrl(IMAGE_URLS[currentImageIndex]);
}

function draw() {
  background(0);
  
  // If we're still generating the mask, show progress
  if (!maskGenerated) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text(`Generating mask: ${floor(loadingProgress * 100)}%`, width/2, height/2);
    return;
  }
  
  // If the image isn't loaded yet, show loading message
  if (!imageLoaded) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text('Loading image...', width/2, height/2);
    return;
  }
  
  // Display the composite image
  image(compositeGraphics, 0, 0);
  
  // Add frame rate display
  fill(255);
  textAlign(LEFT, TOP);
  textSize(12);
  text(`FPS: ${frameRate().toFixed(1)}`, 10, 10);
  text(`Image: ${currentImageIndex + 1}/${IMAGE_URLS.length}`, 10, 30);
}

function generateDotMask() {
  // Start with a clear black background
  maskGraphics.background(0);
  maskGraphics.noStroke();
  maskGraphics.fill(255); // White dots
  
  // Calculate grid properties for evenly distributed dots
  const cols = floor(sqrt(TOTAL_DOTS));
  const rows = cols;
  const spacing = SQUARE_SIZE / cols;
  
  // Generate dots in batches to avoid freezing
  let dotsGenerated = 0;
  let batchSize = 10000;
  
  function generateBatch() {
    let batchStart = dotsGenerated;
    let batchEnd = min(batchStart + batchSize, TOTAL_DOTS);
    
    for (let i = batchStart; i < batchEnd; i++) {
      const col = i % cols;
      const row = floor(i / cols);
      
      // Add a small random offset to avoid perfect grid alignment
      const xOffset = random(-spacing/4, spacing/4);
      const yOffset = random(-spacing/4, spacing/4);
      
      const x = col * spacing + spacing/2 + xOffset;
      const y = row * spacing + spacing/2 + yOffset;
      
      // Draw the dot on the mask
      maskGraphics.circle(x, y, DOT_SIZE);
    }
    
    dotsGenerated = batchEnd;
    loadingProgress = dotsGenerated / TOTAL_DOTS;
    
    updateStatus(`Generated ${dotsGenerated.toLocaleString()} of ${TOTAL_DOTS.toLocaleString()} dots (${(loadingProgress * 100).toFixed(1)}%)`);
    
    if (dotsGenerated < TOTAL_DOTS) {
      // Continue with next batch
      setTimeout(generateBatch, 0);
    } else {
      // Mask is complete
      maskGenerated = true;
      updateStatus("Dot mask generation complete!");
      
      // If image is loaded, create the composite
      if (imageLoaded) {
        createComposite();
      }
    }
  }
  
  // Start generating dots
  generateBatch();
}

function loadImageFromUrl(url) {
  updateStatus(`Loading image: ${url}`);
  imageLoaded = false;
  
  loadImage(
    url,
    img => {
      updateStatus("Image loaded successfully!");
      currentImage = img;
      imageLoaded = true;
      
      // Draw the image to the image graphics buffer
      imageGraphics.clear();
      imageGraphics.image(img, 0, 0, SQUARE_SIZE, SQUARE_SIZE);
      
      // If mask is also ready, create the composite
      if (maskGenerated) {
        createComposite();
      }
    },
    () => {
      console.error(`Failed to load image: ${url}`);
      updateStatus("Failed to load image. Trying next one...");
      currentImageIndex = (currentImageIndex + 1) % IMAGE_URLS.length;
      loadImageFromUrl(IMAGE_URLS[currentImageIndex]);
    }
  );
}

function createComposite() {
  updateStatus("Creating composite view...");
  
  // Start with the image
  compositeGraphics.clear();
  compositeGraphics.image(imageGraphics, 0, 0);
  
  // Apply the mask - this technique uses the mask as a stencil
  compositeGraphics.drawingContext.globalCompositeOperation = 'destination-in';
  compositeGraphics.image(maskGraphics, 0, 0);
  compositeGraphics.drawingContext.globalCompositeOperation = 'source-over';
  
  updateStatus("Ready - Image displayed through dot mask");
}

function saveImage() {
  updateStatus("Saving image...");
  saveCanvas('dot-mask-image', 'png');
  updateStatus("Image saved!");
}

function changeImage() {
  currentImageIndex = (currentImageIndex + 1) % IMAGE_URLS.length;
  updateStatus(`Loading next image (${currentImageIndex + 1}/${IMAGE_URLS.length})...`);
  loadImageFromUrl(IMAGE_URLS[currentImageIndex]);
}

function loadCustomImage() {
  const customUrl = document.getElementById('customUrl').value;
  if (customUrl) {
    updateStatus("Loading custom image...");
    loadImageFromUrl(customUrl);
  } else {
    updateStatus("Please enter a URL first");
  }
}

// Handle key presses for keyboard shortcuts
function keyPressed() {
  // 'S' key for saving
  if (key === 's' || key === 'S') {
    // saveImage();
    return false;
  }
  // Spacebar for changing images
  else if (key === ' ') {
    changeImage();
    return false;
  }
  // 'D' key to debug mask
  else if (key === 'd' || key === 'D') {
    // Show the raw mask for debugging
    image(maskGraphics, 0, 0);
    updateStatus("DEBUG: Showing raw dot mask");
    return false;
  }
  // 'I' key to debug image
  else if (key === 'i' || key === 'I') {
    // Show the raw image for debugging
    image(imageGraphics, 0, 0);
    updateStatus("DEBUG: Showing raw image");
    return false;
  }
  // 'C' key to restore composite view
  else if (key === 'c' || key === 'C') {
    // Restore the composite view
    updateStatus("Restored composite view");
    return false;
  }
}