let num = 25, //number of square clusters
  dDist = 3, //max. random distance of pen's collision detection
  maxState = 5,
  state = 1; //starting state (can be changed by clicking)

let lineW = 1, //stroke weight of lines
  rVel = 0.9, //max. random velocity of drawing pens
  rObst = 0.997, //chance of pen changing direction randomly for each loop
  radius;

let BG; //background color
let c = []; //pen color
let pen = [],
  pPen = [],
  nPen = [],
  velocity = [];
let ratio;

function border() {
  noFill();
  strokeWeight(5);
  if (state > 1) {
    rect(0, 0, width - 1, height - 1);
  }
  strokeWeight(3);
  if (state === 1 || state === 2 || state === 3) {
    ellipse(width / 2, height / 2, radius, radius);
  }
  if (state === 0) {
    let side = height / 8;
    for (let i = 0; i < width; i += side) {
      for (let j = 0; j < height; j += side) {
        rect(i, j, side, side);
      }
    }
  }
}
const p5Container = document.querySelector("#p5_container0");
let w = p5Container.clientWidth;
let h = p5Container.clientHeight;
function setup() {
  const cnv = createCanvas(w, h);
  // Keep the hero sketch scoped to the VitePress component container.
  cnv.parent("p5_container0");

  //state = int(random(maxState));
  ratio = w / h;

  BG = color(0);
  for (let i = 0; i < num; i++) {
    c[i] = [];
    pen[i] = [];
    pPen[i] = [];
    nPen[i] = [];
    velocity[i] = [];
  }
  startPos();
}

function startPos() {
  //sets starting parameter for each pen:
  background(BG);

  if (ratio > 1) {
    radius = height / 2;
  } else {
    radius = width / 2;
  }
  for (let i = 0; i < num; i++) {
    for (let j = 0; j < num; j++) {
      switch (state) {
        case 0:
          pen[i][j] = createVector(random(width), random(height));
          break;
        case 1:
          if (i < num / 4) {
            pen[i][j] = createVector(0, random(height));
          } else if (i > num / 4 && i < (num / 4) * 2) {
            pen[i][j] = createVector(random(width), 0);
          } else if (i > (num / 4) * 2 && i < (num / 4) * 3) {
            pen[i][j] = createVector(width - 1, random(height));
          } else {
            pen[i][j] = createVector(random(width), height - 1);
          }
          break;
        case 2:
          pen[i][j] = createVector(
            map(i, 0, num, width / 5, width - width / 5),
            map(j, 0, num, height / 5, height - height / 5)
          );
          break;
        case 3:
          if (ratio > 1) {
            pen[i][j] = createVector(
              width / 2 + (sin(map(i, 0, num, j, TWO_PI)) * height) / 3,
              height / 2 + (cos(map(i, 0, num, j, TWO_PI)) * height) / 3
            );
          } else {
            pen[i][j] = createVector(
              width / 2 + (sin(map(i, 0, num, j, TWO_PI)) * width) / 3,
              height / 2 + (cos(map(i, 0, num, j, TWO_PI)) * width) / 3
            );
          }
          break;
        case 4:
          pen[i][j] = createVector(
            map(i, j, num, 0, width),
            map(i, j, num, 0, height)
          );

          break;
        case 5:
          if (ratio > 1) {
            pen[i][j] = createVector(
              map(i, j, num, 0, width),
              height / 2 + (cos(map(i, j, num, 0, TWO_PI * 2)) * height) / 3
            );
          } else {
            pen[i][j] = createVector(
              map(i, j, num, 0, width),
              height / 2 + (cos(map(i, j, num, 0, TWO_PI * 2)) * width) / 3
            );
          }

          break;
        default:
        //
      }
      pPen[i][j] = pen[i][j].copy();
      nPen[i][j] = pen[i][j].copy();
      velocity[i][j] = createVector(0, 1);
      velocity[i][j].normalize();
      velocity[i][j].setMag(random(rVel / 2, rVel));
      velocity[i][j].rotate(radians(int(random(7)) * 45));
      c[i][j] = color(random(127, 255));
    }
  }
}

function mouseClicked() {
  if (mouseX > 0 && mouseX < w && mouseY > 0 && mouseY < h) {
    state++;
    if (state > maxState) state = 0;

    startPos();
  }
}

function draw() {
  stroke(1);
  border();
  strokeWeight(lineW);
  for (let i = 0; i < num; i++) {
    for (let j = 0; j < num; j++) {
      stroke(c[i][j]);
      let cFound = false;
      let detector = createVector();

      line(pPen[i][j].x, pPen[i][j].y, pen[i][j].x, pen[i][j].y);
      pPen[i][j] = pen[i][j].copy();
      nPen[i][j] = pen[i][j].copy();

      detector.set(velocity[i][j]);
      detector.normalize();
      detector.setMag(lineW + 1);

      for (let d = 0; d <= 1; d++) {
        nPen[i][j].add(detector);
        if (
          color(get(int(nPen[i][j].x), int(nPen[i][j].y))).toString() !==
          color(BG).toString()
        ) {
          cFound = true;
        }
      }

      if (cFound) {
        if (i % 2 === 0) velocity[i][j].rotate(radians(45));
        else velocity[i][j].rotate(radians(-45));
      } else {
        if (random(1) > rObst) {
          if (i % 2 === 0) velocity[i][j].rotate(radians(-45));
          else velocity[i][j].rotate(radians(45));
        }
      }
      pen[i][j].add(velocity[i][j]);
    }
  }
  stroke(BG);
  border();
}
function windowResized() {
  w = p5Container.clientWidth;
  h = p5Container.clientHeight;
  ratio = w / h;
  resizeCanvas(w, h);
  startPos();
}

/*





















Sketch One:
This program draws a grid of slightly disordered concentric 
squares as an homage to French-Hungarian artist Vera Molnár's 
plotter drawing (Dés)Ordres.
 */
var s = function (p) {
  const p5Container = document.querySelector("#p5_container");
  let w = p5Container.clientWidth;
  let h = p5Container.clientHeight;

  let num = 17,
    maxSq = 21,
    maxW,
    t = 0,
    margin = 25,
    lineW = 0.5,
    rRotate = 1,
    rShear = 0.1,
    rSize = 42;

  p.setup = function () {
    p.createCanvas(w, h);
    p.rectMode(p.CENTER);
    p.noFill();
    p.strokeWeight(lineW);
    p.stroke(0);
  };

  p.draw = function () {
    p.background(255);

    maxW = w / num - (2 * margin) / num;
    if (maxW * num < h) p.translate(0, (h - maxW * num) / 2 - margin);

    for (let i = 0; i < num; i++) {
      for (let j = 0; j < num; j++) {
        if (p.mouseX < 0 || p.mouseX > w || p.mouseY < 0 || p.mouseY > h) {
          maxSq = 15;
        } else {
          maxSq = p.map(
            p.dist(
              p.mouseX,
              p.mouseY,
              margin + maxW / 2 + maxW * i,
              margin + maxW / 2 + maxW * j
            ),
            w,
            0,
            1,
            35
          );
        }

        for (let s = 0; s <= maxSq; s++) {
          let x, n;
          x = maxW;
          n =
            p.map(s, 0, maxSq, 0, x) +
            p.map(p.noise(i, j, s + t), 0, 1, -rSize / 4, rSize);
          p.push();
          p.translate(margin + x / 2 + x * i, margin + x / 2 + x * j);
          p.rotate(
            p.radians(p.map(p.noise(j + t, s + t), 0, 1, -rRotate, rRotate))
          );
          p.shearX(p.map(p.noise(i, s + t), 0, 1, -rShear, rShear));
          p.shearY(p.map(p.noise(i + t, s), 0, 1, -rShear, rShear));
          if (x - n >= 0 && x - n <= x && margin * 1.5 + x + x * j < h)
            p.rect(0, 0, x - n, x - n);
          p.pop();
        }
      }
    }
    t += 0.007;
  };
  p.windowResized = function () {
    w = p5Container.clientWidth;
    h = p5Container.clientHeight;
    p.resizeCanvas(w, h);
  };
};
var myp5 = new p5(s, "p5_container");

/* 











Sketch Two:
This program draws a grid of slightly disordered concentric squares as an 
 homage to French-Hungarian artist Vera Molnár's plotter drawing (Dés)Ordres.
*/

var t = function (p) {
  const p5Container = document.querySelector("#p5_container2");
  let w = p5Container.clientWidth;
  let h = p5Container.clientHeight;

  let drawing = false,
    singlePen = true;

  let xSq,
    ySq,
    num = 17,
    margin = 20;

  let maxSize,
    lineW = 0.5,
    rAngle = 3,
    rShear = 0.025,
    rSize = 10,
    rVel = 0.075;

  let turn = [],
    sideL = [],
    rotation = [],
    shearingX = [],
    shearingY = [],
    pen = [],
    pPen = [],
    lastTurn = [],
    velocity = [];

  p.setup = function () {
    p.createCanvas(w, h);

    p.rectMode(p.CENTER);
    p.strokeWeight(lineW);
    p.stroke(0);
    p.restart();
  };

  p.restart = function () {
    p.background(255);
    maxSize = (w - margin * 2 - lineW) / num;
    if (singlePen) {
      xSq = 1;
      ySq = 1;
    } else {
      xSq = num;
      ySq = num;
    }

    for (let i = 0; i < num; i++) {
      turn[i] = [];
      sideL[i] = [];
      rotation[i] = [];
      shearingX[i] = [];
      shearingY[i] = [];
      pen[i] = [];
      pPen[i] = [];
      lastTurn[i] = [];
      velocity[i] = [];
      for (let j = 0; j < num; j++) {
        sideL[i][j] = maxSize;
        pen[i][j] = p.createVector(-sideL[i][j] / 2, -sideL[i][j] / 2);
        p.randomize(i, j);
      }
    }
  };

  p.randomize = function (i, j) {
    rotation[i][j] = p.random(-rAngle, rAngle);
    shearingX[i][j] = p.random(-rShear, rShear);
    shearingY[i][j] = p.random(-rShear, rShear);
    pPen[i][j] = pen[i][j].copy();
    lastTurn[i][j] = pen[i][j].copy();
    velocity[i][j] = p.createVector(
      p.random(maxSize * rVel, maxSize * rVel),
      0
    );
    turn[i][j] = 0;
  };

  p.draw = function () {
    drawing = false;
    for (let i = 0; i < xSq; i++) {
      for (let j = 0; j < ySq; j++) {
        if (sideL[i][j] > 0) {
          drawing = true;
          p.push();
          p.translate(
            margin + maxSize * i + maxSize / 2,
            margin + maxSize * j + maxSize / 2
          );
          p.rotate(p.radians(rotation[j][i]));
          p.shearX(shearingX[i][j]);
          p.shearY(shearingY[i][j]);
          p.line(pPen[i][j].x, pPen[i][j].y, pen[i][j].x, pen[i][j].y);
          p.pop();

          if (turn[i][j] == 4) {
            let r = p.random(rSize);
            sideL[i][j] -= r;
            pen[i][j].add(r / 2, r / 2);
            p.randomize(i, j);
          }
        }

        if (
          p.dist(
            pen[i][j].x,
            pen[i][j].y,
            lastTurn[i][j].x,
            lastTurn[i][j].y
          ) >= sideL[i][j]
        ) {
          velocity[i][j].rotate(p.PI / 2);
          lastTurn[i][j] = pen[i][j].copy();
          turn[i][j]++;
        } else {
          pPen[i][j] = pen[i][j].copy();
          pen[i][j].add(velocity[i][j]);
        }
      }
    }

    if (singlePen) {
      if (ySq <= num) {
        if (drawing == false && xSq == num) {
          xSq = 0;
          ySq++;
        }
        if (drawing == false && ySq <= num) xSq++;
        drawing = true;
      }
    }
  };

  //p.mouseClicked = function () {};

  p.windowResized = function () {
    w = p5Container.clientWidth;
    h = p5Container.clientHeight;

    p.resizeCanvas(w, h);
    p.restart();
  };
};

var myp5 = new p5(t, "p5_container2");

/* 









Sketch Three:
*/
var t = function (p) {
  const p5Container = document.querySelector("#temp");
  let w = p5Container.clientWidth;
  let h = p5Container.clientHeight;

  p.setup = function () {
    p.createCanvas(w, h);
  };

  p.draw = function () {
    p.background(100);
    p.ellipse(p.mouseX, p.mouseY, 50, 50);
  };
};

/*







Sketch Template:
*/
var t = function (p) {
  const p5Container = document.querySelector("#temp");
  let w = p5Container.clientWidth;
  let h = p5Container.clientHeight;

  p.setup = function () {
    p.createCanvas(w, h);
  };

  p.draw = function () {
    p.background(100);
    p.ellipse(p.mouseX, p.mouseY, 50, 50);
  };
};
