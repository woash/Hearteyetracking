// Global variables for eye tracking
let centerX, centerY;
let gazeThreshold = 300;
let gazeX = 0;
let gazeY = 0;
let isCalibrated = false;
let calibrationPoints = [];
let calibrationComplete = false;
let calibrationStarted = false;

// Global variables for heart animation
let hearts = [];
let maxSize = 400;
let heartInterval = 300;
let lastHeartTime = 0;
let isLookingAtCenter = false;
let blurAmount = 10; // Lower blur amount for better performance
let heartGraphics; // Off-screen graphics buffer for hearts

// Preload WebGazer.js
function preload() {
  // In a real application, you would include WebGazer as a script tag in your HTML:
  // <script src="https://webgazer.cs.brown.edu/webgazer.js"></script>
  font = loadFont('costura_demibold.otf')
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font)
  centerX = width / 2;
  centerY = height / 2;
  background('white');
  
  // Create off-screen graphics buffer for blurred hearts
  heartGraphics = createGraphics(width, height);
  
  // Create calibration points at corners and center
  calibrationPoints = [
   // {x: 100, y: 100, clicked: false},
    {x: width - 100, y: 100, clicked: false},
    {x: width - 100, y: height - 100, clicked: false},
    {x: 100, y: height - 100, clicked: false},
    {x: width/2, y: height/2, clicked: false}
  ];
  
  setupEyeTracking();
}

function setupEyeTracking() {
  // Check if webgazer is available
  if (typeof webgazer !== 'undefined') {
    // Initialize WebGazer
    webgazer.setGazeListener(function(data, elapsedTime) {
      if (data == null || !calibrationComplete) return;
      
      // Get gaze position
      gazeX = data.x;
      gazeY = data.y;
    }).begin();
    
    // Minimize the video element that WebGazer creates rather than hiding completely
    minimizeWebGazerVideo();
    
    // Start calibration process
    calibrationStarted = true;
  } else {
    // Fall back to mouse tracking if WebGazer isn't available
    console.log("WebGazer not found. Falling back to mouse tracking.");
    isCalibrated = true;
    calibrationComplete = true;
  }
}

function minimizeWebGazerVideo() {
  // This function needs to run after WebGazer has initialized
  // and created its video elements
  setTimeout(() => {
    hideWebGazerElements();
  }, 1000); // Give WebGazer a second to initialize
}

function hideWebGazerElements() {
  // Find and hide all video elements created by WebGazer
  const videoElements = document.querySelectorAll('video');
  videoElements.forEach(video => {
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.opacity = '0';
    
    // Also hide any parent container that WebGazer might create
    if (video.parentElement) {
      if (video.parentElement.className && 
          video.parentElement.className.includes('webgazer')) {
        video.parentElement.style.width = '1px';
        video.parentElement.style.height = '1px';
        video.parentElement.style.overflow = 'hidden';
        video.parentElement.style.opacity = '0';
      }
      // Hide parent div regardless of class
      if (video.parentElement.tagName === 'DIV') {
        video.parentElement.style.width = '1px';
        video.parentElement.style.height = '1px';
        video.parentElement.style.overflow = 'hidden';
        video.parentElement.style.opacity = '0';
      }
    }
  });
  
  // Hide any canvas elements WebGazer creates for face tracking visualization
  const canvasElements = document.querySelectorAll('canvas');
  canvasElements.forEach(canvas => {
    // Check if this is a WebGazer canvas
    if (canvas.className && canvas.className.includes('webgazer') ||
        canvas.id && canvas.id.includes('webgazer') ||
        canvas.width > 0 && canvas.height > 0 && 
        canvas.style.position === 'fixed') {
      canvas.style.width = '1px';
      canvas.style.height = '1px';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.opacity = '0';
    }
  });
  
  // Hide all WebGazer-related divs (including the green frame)
  const divElements = document.querySelectorAll('div');
  divElements.forEach(div => {
    if ((div.className && div.className.includes('webgazer')) ||
        (div.id && div.id.includes('webgazer'))) {
      div.style.width = '1px';
      div.style.height = '1px';
      div.style.overflow = 'hidden';
      div.style.opacity = '0';
      div.style.position = 'fixed';
      div.style.top = '0';
      div.style.left = '0';
    }
  });
}

function draw() {
  if (!calibrationComplete) {
    drawCalibration();
    return;
  }
  
  background('black');
  
  // Use either gaze position or mouse position based on calibration
  let trackX = isCalibrated ? gazeX : mouseX;
  let trackY = isCalibrated ? gazeY : mouseY;
  
  // Calculate distance from gaze to center
  let d = dist(trackX, trackY, centerX, centerY);
  
  // Check if looking at center
  isLookingAtCenter = d < gazeThreshold;
  
  // Generate a new heart at intervals if looking at center
  if (isLookingAtCenter && millis() - lastHeartTime > heartInterval) {
    hearts.push(new Heart(width / 2, height / 2));
    lastHeartTime = millis();
  }
  
  // Clear the graphics buffer
  heartGraphics.clear();
  
  // Update and display hearts on the graphics buffer
  for (let i = hearts.length - 1; i >= 0; i--) {
    hearts[i].update();
    hearts[i].display(heartGraphics);
    // Remove heart if fully faded
    if (hearts[i].alpha <= 0) {
      hearts.splice(i, 1);
    }
  }
  
  // Apply blur to the entire heart graphics at once (more efficient)
  if (hearts.length > 0) {
    heartGraphics.filter(BLUR, blurAmount);
  }
  
  // Draw the blurred hearts to the main canvas
  image(heartGraphics, 0, 0);
  
  // // Draw center point
  // noFill();
  // stroke(255, 0, 100);
  // strokeWeight(2);
  // ellipse(centerX, centerY, 20, 20);
  
  // // Draw threshold circle
  // strokeWeight(1);
  // stroke(255, 0, 100, 80);
  // ellipse(centerX, centerY, gazeThreshold * 2);
  
  // Show status message
  push()
  noStroke()
  fill(0);
  textSize(16);
  textAlign(CENTER);
  if (isLookingAtCenter) {
    text("I see you", width/2, height/2);
  } else {
    text("Look at me", width/2, height/2);
  }
  pop()
  
  // Draw gaze point
  if (isCalibrated) {
    noFill()
    noStroke();
    ellipse(gazeX, gazeY, 10, 10);
  }
}

// Heart class for animation
class Heart {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 10; // Start small and grow
    this.alpha = 255; // Opacity for fade effect
    this.color = color(255, 0, 0, this.alpha); // Red heart
  }
  
  update() {
    this.size += 10; // Expand heart
    this.alpha -= 10; // Slowly fade out
  }
  
  display(graphics) {
    graphics.fill(255, 0, 0, this.alpha); // Red with transparency
    graphics.noStroke();
    drawHeart(graphics, this.x, this.y, this.size);
  }
}

// Function to draw a heart shape using parametric equations
function drawHeart(g, x, y, size) {
  g.beginShape();
  for (let angle = 0; angle < TWO_PI; angle += 0.05) {
   let r = size * 0.1; // Scale factor
    let noiseFactor = noise(angle * 2, frameCount * 0.01) * 5; // Adds distortion
    let px = x + (r + noiseFactor) * 16 * pow(sin(angle), 3);
    let py = y - (r + noiseFactor) * (13 * cos(angle) - 5 * cos(2 * angle) - 2 * cos(3 * angle) - cos(4 * angle));
    g.vertex(px, py);
  }
  g.endShape(CLOSE);
}

function drawCalibration() {
  background('white');
  textSize(24);
  textAlign(CENTER, CENTER);
  fill(0);
  
  if (allPointsClicked()) {
    text("Calibration complete.", width/2, 50);
    text("Press ENTER to start the heart visualization.", width/2, height - 50);
  } else {
    text("Click on each circle to calibrate eye tracking", width/2, 50);
    
    // Highlight which point to click next
    let nextPointIndex = -1;
    for (let i = 0; i < calibrationPoints.length; i++) {
      if (!calibrationPoints[i].clicked) {
        nextPointIndex = i;
        break;
      }
    }
  }
  
  // Draw calibration points
  for (let i = 0; i < calibrationPoints.length; i++) {
    let p = calibrationPoints[i];
    
    if (p.clicked) {
      fill('blue');  // Green for clicked points
    } else {
      fill('white');  // Red for unclicked points
    }
    
    push()
    stroke('black')
    ellipse(p.x, p.y, 40, 40);
    pop()
    
    // Add text to show point number
    // fill('black');
    // textSize(18);
    // text(i+1, p.x, p.y);
  }
}

function getPositionName(index) {
  switch(index) {
    case 0: return "top-left";
    case 1: return "top-right";
    case 2: return "bottom-right";
    case 3: return "bottom-left";
    case 4: return "center";
    default: return "";
  }
}

function mousePressed() {
  if (!calibrationComplete) {
    // Check if any calibration point was clicked
    for (let i = 0; i < calibrationPoints.length; i++) {
      let p = calibrationPoints[i];
      if (dist(mouseX, mouseY, p.x, p.y) < 20) {
        p.clicked = true;
        
        // If WebGazer is available, update its calibration
        if (typeof webgazer !== 'undefined') {
          webgazer.clickLoc(p.x, p.y);
        }
      }
    }
  }
}

function keyPressed() {
  if (keyCode === ENTER && allPointsClicked()) {
    calibrationComplete = true;
    isCalibrated = true;
    
    // Hide all WebGazer elements after calibration
    hideWebGazerElements();
    
    // Make extra sure by running it again after a short delay
    // (sometimes WebGazer creates elements after calibration)
    setTimeout(hideWebGazerElements, 500);
  }
}

function allPointsClicked() {
  for (let i = 0; i < calibrationPoints.length; i++) {
    if (!calibrationPoints[i].clicked) {
      return false;
    }
  }
  return true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  heartGraphics.resizeCanvas(windowWidth, windowHeight);
  centerX = width / 2;
  centerY = height / 2;
  
  // Update calibration point positions if we resize during calibration
  if (!calibrationComplete) {
    calibrationPoints[1].x = width - 100;
    calibrationPoints[2].x = width - 100;
    calibrationPoints[2].y = height - 100;
    calibrationPoints[3].y = height - 100;
    calibrationPoints[4].x = width/2;
    calibrationPoints[4].y = height/2;
  }
}

// Add this to ensure cleanup when user leaves the page
window.addEventListener('unload', function() {
  if (typeof webgazer !== 'undefined') {
    webgazer.end();
  }
});