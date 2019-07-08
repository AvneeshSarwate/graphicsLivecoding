// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids

function Flock() {
    // An array for all the boids
    this.boids = []; // Initialize the array
}

Flock.prototype.run = function () {
    for (let i = 0; i < this.boids.length; i++) {
        this.boids[i].run(this.boids);  // Passing the entire list of boids to each boid individually
    }
}

Flock.prototype.addBoid = function (b) {
    this.boids.push(b);
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x, y, svgCreator, width, height, letterSize, circleSize, resAdjust) {
    this.svgElement = svgCreator(circleSize);
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.position = createVector(x, y);
    this.rx = (letterSize.x+circleSize/2) * 1.1;
    this.ry = (letterSize.y+circleSize/2) * 1.1;
    this.maxspeed = 3 * 2;    // Maximum speed
    this.maxforce = 0.05; // Maximum steering force
    this.width = width;
    this.height = height;
    this.resAdjust = resAdjust;
}

Boid.prototype.run = function (boids) {
    this.flock(boids);
    this.update();
    this.borders();
    this.render();
}

Boid.prototype.applyForce = function (force) {
    // We could add mass here if we want A = F / M
    this.acceleration.add(force);
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function (boids) {
    let sep = this.separate(boids);   // Separation
    let ali = this.align(boids);      // Alignment
    let coh = this.cohesion(boids);   // Cohesion
    // Arbitrarily weight these forces
    sep.mult(40.5);
    ali.mult(10.0);
    coh.mult(1.0);
    // Add the force vectors to acceleration
    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
}

// Method to update location
Boid.prototype.update = function () {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);

    var isXDominant = this.velocity.x >= this.velocity.y;
    var velMag = this.velocity.mag();

    var singleDirection = createVector(isXDominant ? velMag : 0, isXDominant ? 0 : velMag);
    // this.velocity = singleDirection;

    this.position.add(this.velocity.mult(this.resAdjust));
    // Reset accelertion to 0 each cycle
    this.acceleration.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function (target) {
    let desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
    // Normalize desired and scale to maximum speed
    desired.normalize();
    desired.mult(this.maxspeed);
    // Steering = Desired minus Velocity
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);  // Limit to maximum steering force
    return steer;
}

Boid.prototype.render = function () {
    // Draw a triangle rotated in the direction of velocity
    let theta = this.velocity.heading() + radians(90);
    this.svgElement.center(this.position.x, this.position.y);
}

// Bounce
Boid.prototype.borders = function () {
    var fac =  2; 1.1; //border overlap factor
    if (this.position.x < this.rx/fac || this.position.x > this.width - this.rx/fac) {
        this.velocity.x = -this.velocity.x;
        if(this.position.x < this.rx/fac) this.position.x = this.rx/fac;
        if(this.position.x > this.width - this.rx/fac) this.position.x = this.width - this.rx/fac;
    }
    if (this.position.y < this.ry/fac || this.position.y > this.height - this.ry/fac) {
        this.velocity.y= -this.velocity.y;
        if(this.position.y < this.ry/fac) this.position.y = this.ry/fac;
        if(this.position.y > this.height - this.ry/fac) this.position.y = this.height - this.ry/fac;
    }
}

// Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function (boids) {
    let desiredseparation = 25.0;
    let steer = createVector(0, 0);
    let count = 0;
    // For every boid in the system, check if it's too close
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
        if ((d > 0) && (d < desiredseparation)) {
            // Calculate vector pointing away from neighbor
            let diff = p5.Vector.sub(this.position, boids[i].position);
            diff.normalize();
            diff.div(d);        // Weight by distance
            steer.add(diff);
            count++;            // Keep track of how many
        }
    }
    // Average -- divide by how many
    if (count > 0) {
        steer.div(count);
    }

    // As long as the vector is greater than 0
    if (steer.mag() > 0) {
        // Implement Reynolds: Steering = Desired - Velocity
        steer.normalize();
        steer.mult(this.maxspeed);
        steer.sub(this.velocity);
        steer.limit(this.maxforce);
    }
    return steer;
}

// Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function (boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
            sum.add(boids[i].velocity);
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        sum.normalize();
        sum.mult(this.maxspeed);
        let steer = p5.Vector.sub(sum, this.velocity);
        steer.limit(this.maxforce);
        return steer;
    } else {
        return createVector(0, 0);
    }
}

// Cohesion
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function (boids) {
    let neighbordist = 50;
    let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
    let count = 0;
    for (let i = 0; i < boids.length; i++) {
        let d = p5.Vector.dist(this.position, boids[i].position);
        if ((d > 0) && (d < neighbordist)) {
            sum.add(boids[i].position); // Add location
            count++;
        }
    }
    if (count > 0) {
        sum.div(count);
        return this.seek(sum);  // Steer towards the location
    } else {
        return createVector(0, 0);
    }
}


