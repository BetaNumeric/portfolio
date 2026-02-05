/* eslint-disable */
/**
 * Algorithmic Drawing sketches (self-hosted).
 *
 * Important: This file avoids p5 global-mode to prevent cross-page collisions
 * in VitePress' SPA runtime.
 *
 * Exposes:
 *   window.__VP_ALGO_MOUNT()   -> create sketches when containers exist
 *   window.__VP_ALGO_UNMOUNT() -> remove created instances
 */

(function () {
  // Track instances so we can reliably stop them on navigation.
  var instances = []

  function safeRemove(inst) {
    try {
      if (inst && inst.remove) inst.remove()
    } catch (e) {}
  }

  function unmount() {
    for (var i = 0; i < instances.length; i++) safeRemove(instances[i])
    instances = []
  }

  // --- HERO SKETCH (#p5_container0) ---
  function heroSketch(p) {
    var num = 25 // number of square clusters
    var maxState = 5
    var state = 1 // starting state (can be changed by clicking)

    var lineW = 1 // stroke weight of lines
    var rVel = 0.9 // max. random velocity of drawing pens
    var rObst = 0.997 // chance of pen changing direction randomly for each loop
    var radius

    var BG // background color
    var c = [] // pen color
    var pen = []
    var pPen = []
    var nPen = []
    var velocity = []
    var ratio

    function border() {
      p.noFill()
      p.strokeWeight(5)
      if (state > 1) {
        p.rect(0, 0, p.width - 1, p.height - 1)
      }
      p.strokeWeight(3)
      if (state === 1 || state === 2 || state === 3) {
        p.ellipse(p.width / 2, p.height / 2, radius, radius)
      }
      if (state === 0) {
        var side = p.height / 8
        for (var i = 0; i < p.width; i += side) {
          for (var j = 0; j < p.height; j += side) {
            p.rect(i, j, side, side)
          }
        }
      }
    }

    function startPos() {
      p.background(BG)

      if (ratio > 1) {
        radius = p.height / 2
      } else {
        radius = p.width / 2
      }

      for (var i = 0; i < num; i++) {
        for (var j = 0; j < num; j++) {
          switch (state) {
            case 0:
              pen[i][j] = p.createVector(p.random(p.width), p.random(p.height))
              break
            case 1:
              if (i < num / 4) {
                pen[i][j] = p.createVector(0, p.random(p.height))
              } else if (i > num / 4 && i < (num / 4) * 2) {
                pen[i][j] = p.createVector(p.random(p.width), 0)
              } else if (i > (num / 4) * 2 && i < (num / 4) * 3) {
                pen[i][j] = p.createVector(p.width - 1, p.random(p.height))
              } else {
                pen[i][j] = p.createVector(p.random(p.width), p.height - 1)
              }
              break
            case 2:
              pen[i][j] = p.createVector(
                p.map(i, 0, num, p.width / 5, p.width - p.width / 5),
                p.map(j, 0, num, p.height / 5, p.height - p.height / 5)
              )
              break
            case 3:
              if (ratio > 1) {
                pen[i][j] = p.createVector(
                  p.width / 2 + (p.sin(p.map(i, 0, num, j, p.TWO_PI)) * p.height) / 3,
                  p.height / 2 + (p.cos(p.map(i, 0, num, j, p.TWO_PI)) * p.height) / 3
                )
              } else {
                pen[i][j] = p.createVector(
                  p.width / 2 + (p.sin(p.map(i, 0, num, j, p.TWO_PI)) * p.width) / 3,
                  p.height / 2 + (p.cos(p.map(i, 0, num, j, p.TWO_PI)) * p.width) / 3
                )
              }
              break
            case 4:
              pen[i][j] = p.createVector(
                p.map(i, j, num, 0, p.width),
                p.map(i, j, num, 0, p.height)
              )
              break
            case 5:
              if (ratio > 1) {
                pen[i][j] = p.createVector(
                  p.map(i, j, num, 0, p.width),
                  p.height / 2 + (p.cos(p.map(i, j, num, 0, p.TWO_PI * 2)) * p.height) / 3
                )
              } else {
                pen[i][j] = p.createVector(
                  p.map(i, j, num, 0, p.width),
                  p.height / 2 + (p.cos(p.map(i, j, num, 0, p.TWO_PI * 2)) * p.width) / 3
                )
              }
              break
            default:
          }

          pPen[i][j] = pen[i][j].copy()
          nPen[i][j] = pen[i][j].copy()
          velocity[i][j] = p.createVector(0, 1)
          velocity[i][j].normalize()
          velocity[i][j].setMag(p.random(rVel / 2, rVel))
          velocity[i][j].rotate(p.radians(parseInt(p.random(7), 10) * 45))
          c[i][j] = p.color(p.random(127, 255))
        }
      }
    }

    p.setup = function () {
      var container = document.getElementById('p5_container0')
      var w = container ? container.clientWidth : window.innerWidth
      var h = container ? container.clientHeight : Math.floor(window.innerHeight * 0.6)

      var cnv = p.createCanvas(w, h)
      if (container) cnv.parent('p5_container0')

      ratio = w / h
      BG = p.color(0)

      for (var i = 0; i < num; i++) {
        c[i] = []
        pen[i] = []
        pPen[i] = []
        nPen[i] = []
        velocity[i] = []
      }

      startPos()
    }

    p.mouseClicked = function () {
      if (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
        state++
        if (state > maxState) state = 0
        startPos()
      }
    }

    p.draw = function () {
      p.stroke(1)
      border()
      p.strokeWeight(lineW)

      for (var i = 0; i < num; i++) {
        for (var j = 0; j < num; j++) {
          p.stroke(c[i][j])
          var cFound = false
          var detector = p.createVector()

          p.line(pPen[i][j].x, pPen[i][j].y, pen[i][j].x, pen[i][j].y)
          pPen[i][j] = pen[i][j].copy()
          nPen[i][j] = pen[i][j].copy()

          detector.set(velocity[i][j])
          detector.normalize()
          detector.setMag(lineW + 1)

          for (var d = 0; d <= 1; d++) {
            nPen[i][j].add(detector)
            if (
              p.color(p.get(parseInt(nPen[i][j].x, 10), parseInt(nPen[i][j].y, 10))).toString() !==
              p.color(BG).toString()
            ) {
              cFound = true
            }
          }

          if (cFound) {
            if (i % 2 === 0) velocity[i][j].rotate(p.radians(45))
            else velocity[i][j].rotate(p.radians(-45))
          } else {
            if (p.random(1) > rObst) {
              if (i % 2 === 0) velocity[i][j].rotate(p.radians(-45))
              else velocity[i][j].rotate(p.radians(45))
            }
          }

          pen[i][j].add(velocity[i][j])
        }
      }

      p.stroke(BG)
      border()
    }

    p.windowResized = function () {
      var container = document.getElementById('p5_container0')
      if (!container) return
      var w = container.clientWidth
      var h = container.clientHeight
      ratio = w / h
      p.resizeCanvas(w, h)
      startPos()
    }
  }

  /*
  Sketch One:
  This program draws a grid of slightly disordered concentric
  squares as an homage to French-Hungarian artist Vera Molnár's
  plotter drawing (Dés)Ordres.
  */
  function sketchOne(p) {
    var p5Container = null
    var w = 0
    var h = 0

    var num = 17,
      maxSq = 21,
      maxW,
      t = 0,
      margin = 25,
      lineW = 0.5,
      rRotate = 1,
      rShear = 0.1,
      rSize = 42

    p.setup = function () {
      p5Container = document.getElementById('p5_container')
      if (!p5Container) {
        p.noLoop()
        return
      }

      w = p5Container.clientWidth
      h = p5Container.clientHeight
      var cnv = p.createCanvas(w, h)
      cnv.parent('p5_container')

      p.rectMode(p.CENTER)
      p.noFill()
      p.strokeWeight(lineW)
      p.stroke(0)

    }

    p.draw = function () {
      if (!p5Container) return

      p.background(255)

      maxW = w / num - (2 * margin) / num
      if (maxW * num < h) p.translate(0, (h - maxW * num) / 2 - margin)

      for (var i = 0; i < num; i++) {
        for (var j = 0; j < num; j++) {
          if (p.mouseX < 0 || p.mouseX > w || p.mouseY < 0 || p.mouseY > h) {
            maxSq = 15
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
            )
          }

          for (var s = 0; s <= maxSq; s++) {
            var x = maxW
            var n =
              p.map(s, 0, maxSq, 0, x) +
              p.map(p.noise(i, j, s + t), 0, 1, -rSize / 4, rSize)
            p.push()
            p.translate(margin + x / 2 + x * i, margin + x / 2 + x * j)
            p.rotate(p.radians(p.map(p.noise(j + t, s + t), 0, 1, -rRotate, rRotate)))
            p.shearX(p.map(p.noise(i, s + t), 0, 1, -rShear, rShear))
            p.shearY(p.map(p.noise(i + t, s), 0, 1, -rShear, rShear))
            if (x - n >= 0 && x - n <= x && margin * 1.5 + x + x * j < h) {
              p.rect(0, 0, x - n, x - n)
            }
            p.pop()
          }
        }
      }

      t += 0.007
    }

    p.windowResized = function () {
      if (!p5Container) return
      w = p5Container.clientWidth
      h = p5Container.clientHeight
      p.resizeCanvas(w, h)
    }
  }

  /*
  Sketch Two:
  This program draws a grid of slightly disordered concentric squares as an
  homage to French-Hungarian artist Vera Molnár's plotter drawing (Dés)Ordres.
  */
  function sketchTwo(p) {
    var p5Container = null
    var w = 0
    var h = 0

    var drawing = false,
      singlePen = true

    var xSq,
      ySq,
      num = 17,
      margin = 20

    var maxSize,
      lineW = 0.5,
      rAngle = 3,
      rShear = 0.025,
      rSize = 10,
      rVel = 0.075

    var turn = [],
      sideL = [],
      rotation = [],
      shearingX = [],
      shearingY = [],
      pen = [],
      pPen = [],
      lastTurn = [],
      velocity = []

    p.setup = function () {
      p5Container = document.getElementById('p5_container2')
      if (!p5Container) {
        p.noLoop()
        return
      }

      w = p5Container.clientWidth
      h = p5Container.clientHeight
      var cnv = p.createCanvas(w, h)
      cnv.parent('p5_container2')

      p.rectMode(p.CENTER)
      p.strokeWeight(lineW)
      p.stroke(0)
      p.restart()
    }

    p.restart = function () {
      if (!p5Container) return

      p.background(255)
      maxSize = (w - margin * 2 - lineW) / num

      if (singlePen) {
        xSq = 1
        ySq = 1
      } else {
        xSq = num
        ySq = num
      }

      for (var i = 0; i < num; i++) {
        turn[i] = []
        sideL[i] = []
        rotation[i] = []
        shearingX[i] = []
        shearingY[i] = []
        pen[i] = []
        pPen[i] = []
        lastTurn[i] = []
        velocity[i] = []

        for (var j = 0; j < num; j++) {
          sideL[i][j] = maxSize
          pen[i][j] = p.createVector(-sideL[i][j] / 2, -sideL[i][j] / 2)
          p.randomize(i, j)
        }
      }
    }

    p.randomize = function (i, j) {
      rotation[i][j] = p.random(-rAngle, rAngle)
      shearingX[i][j] = p.random(-rShear, rShear)
      shearingY[i][j] = p.random(-rShear, rShear)
      pPen[i][j] = pen[i][j].copy()
      lastTurn[i][j] = pen[i][j].copy()
      velocity[i][j] = p.createVector(p.random(maxSize * rVel, maxSize * rVel), 0)
      turn[i][j] = 0
    }

    p.draw = function () {
      if (!p5Container) return

      drawing = false

      for (var i = 0; i < xSq; i++) {
        for (var j = 0; j < ySq; j++) {
          if (sideL[i][j] > 0) {
            drawing = true
            p.push()
            p.translate(margin + maxSize * i + maxSize / 2, margin + maxSize * j + maxSize / 2)
            p.rotate(p.radians(rotation[j][i]))
            p.shearX(shearingX[i][j])
            p.shearY(shearingY[i][j])
            p.line(pPen[i][j].x, pPen[i][j].y, pen[i][j].x, pen[i][j].y)
            p.pop()

            if (turn[i][j] == 4) {
              var r = p.random(rSize)
              sideL[i][j] -= r
              pen[i][j].add(r / 2, r / 2)
              p.randomize(i, j)
            }
          }

          if (p.dist(pen[i][j].x, pen[i][j].y, lastTurn[i][j].x, lastTurn[i][j].y) >= sideL[i][j]) {
            velocity[i][j].rotate(p.PI / 2)
            lastTurn[i][j] = pen[i][j].copy()
            turn[i][j]++
          } else {
            pPen[i][j] = pen[i][j].copy()
            pen[i][j].add(velocity[i][j])
          }
        }
      }

      if (singlePen) {
        if (ySq <= num) {
          if (drawing == false && xSq == num) {
            xSq = 0
            ySq++
          }
          if (drawing == false && ySq <= num) xSq++
          drawing = true
        }
      }
    }

    p.windowResized = function () {
      if (!p5Container) return

      w = p5Container.clientWidth
      h = p5Container.clientHeight
      p.resizeCanvas(w, h)
      p.restart()
    }
  }

  function mount() {
    if (typeof window.p5 !== 'function') return

    // Ensure we never double-mount.
    unmount()

    // Hero container exists in the component template, so this is safe.
    if (document.getElementById('p5_container0')) {
      instances.push(new window.p5(heroSketch, 'p5_container0'))
    }

    // The text containers are rendered by markdown; depending on navigation timing
    // they may not be in the DOM yet. Retry briefly.
    var attempts = 0
    function tryMountText() {
      attempts++

      if (document.getElementById('p5_container') && !document.getElementById('p5_container').querySelector('canvas')) {
        instances.push(new window.p5(sketchOne, 'p5_container'))
      }
      if (document.getElementById('p5_container2') && !document.getElementById('p5_container2').querySelector('canvas')) {
        instances.push(new window.p5(sketchTwo, 'p5_container2'))
      }

      var needMore = (!document.getElementById('p5_container') || !document.getElementById('p5_container2'))
      if (needMore && attempts < 30) {
        setTimeout(tryMountText, 50)
      }
    }

    tryMountText()
  }

  window.__VP_ALGO_MOUNT = mount
  window.__VP_ALGO_UNMOUNT = unmount
})()
