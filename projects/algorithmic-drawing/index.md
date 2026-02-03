---
layout: project
title: Algorithmic Drawing
year: 2022
description: "A digital plotter that draws images in homage to Vera Molnár"
heroImage: /projects/algorithmic-drawing/algorithmic_drawing.jpg
heroComponent: AlgorithmicDrawingEmbed
previewMedia: /projects/algorithmic-drawing/
gallery:
  - /projects/algorithmic-drawing/gallery/algorithmic_drawing_0.jpg
  - /projects/algorithmic-drawing/gallery/algorithmic_drawing_1.jpg
  - /projects/algorithmic-drawing/gallery/algorithmic_drawing_2.jpg
  - /projects/algorithmic-drawing/gallery/algorithmic_drawing_3.jpg
---


<ProjectAccordion :alwaysOpen="true" :centerImages="true">

**DESCRIPTION**

For this programming project, I reimagined a work by Vera Molnár, a French-Hungarian artist and pioneer in algorithmic art.

Something about her work [(Dés)Ordres](https://dam.org/museum/artists_ui/artists/molnar-vera/des-ordres/) from 1974 was right away aesthetically pleasing to me. It blurred the line between the cold and preciseness usually associated with computers and the irregularities and imperfections and organic look of a drawing by hand.

![Vera Molnár, (Dés)Ordres, plotter drawing, 70x70 cm, 1974](/projects/algorithmic-drawing/molnar_original.jpg)
 
It made me think about the time it must have taken for the plotter to draw the whole image, and whether it would even be possible to draw it like that by hand.

The image is part of a series in which she programmed a plotter to draw a grid of concentric squares and then introduced different amounts of randomness into the process. She shows how disorder can show up in a system, while the underlying logic still prevails.

In the work I chose, she drew a grid of 17 x 17 concentric squares that were unevenly scaled, rotated, and stretched. 

It looked to me as if the squares were shaking and I wanted to recreate the image in Processing and add a motion to it.

### Recreating Vera’s Work

I started by recursively drawing a simple grid of perfectly ordered concentric squares. The results were quite a pain to the eye and a kind of McCollough effect happened when looking at it too long.

![Grid of perfectly ordered concentric squares](/projects/algorithmic-drawing/algorithmic_drawing_1.jpg)


With this as underlying logic, I tried to introduce some disorder in the squares. For that, I added or subtracted from the different values used to construct the image. The first value was the amount of the scale of the concentric squares. This made some of them have more empty space between the squares and some have overlapping lines that made it look as if the lines were thicker.

![Adding scale randomness](/projects/algorithmic-drawing/algorithmic_drawing_2.jpg)


After that, I introduced a random rotation to each square, which already made them look closer to Molnár’s drawing. I also added a margin, so the edges of the largest rectangles wouldn’t be clipped off.
![Adding rotation](/projects/algorithmic-drawing/algorithmic_drawing_3.jpg)

Finally, I slightly sheared the squares in a random x- and y-direction to deform the squares. I also thought about placing each square slightly off-center, but I don’t think she did that in her work, so I removed that factor again.

![Final result with shearing](/projects/algorithmic-drawing/algorithmic_drawing_4.jpg)

### Experimenting with the code

To make the drawing move, I used a time variable that is slowly counting up as the program runs in the draw function. I then use the time variable to change the randomness variables with Perlin noise. This creates a smooth motion between the states of disorder.

<div id="p5_container" style="width: 72svh; height: 72svh; margin: 2rem auto; border: 1px solid var(--site-border);"></div>

After completing this program, it made me think about the speed with which the program draws the whole campus. Within a fraction of a second, thousands of squares are drawn and displayed. I thought about how watching a plotter draw each line might add to the value of the drawing. I decided to rewrite the code, to visualize the generating of the image, similar to how a plotter might draw it.

Instead of drawing the rectangles with the built-in rect() function, I programmed a dot to move and draw the lines that make up the rectangle. So instead of drawing them all at once, I used vectors for the position and velocity of the plotter’s “pen”. For each loop through the draw() function I added the velocity vector to the position, and once the desired length was reached I rotated the velocity vector by 90°. After 4 lines have reached the desired length, the program moves the pen inwards with a slightly random value and repeats the steps, but with a smaller maximum length for the lines. For each square, I applied the same random factors for rotation, shearing, and scaling and added a random velocity.

<div id="p5_container2" style="width: 72svh; height: 72svh; margin: 2rem auto; border: 1px solid var(--site-border);"></div>

However, instead of drawing the image with just one pen, I thought it would be interesting to make my plotter have multiple pens drawing the squares simultaneously. Each cluster of concentric squares starts at the same time, with a different velocity, and once it has drawn 4 lines moves inward. The whole canvas slowly starts filling up, some squares need more time, and others reach their center faster.

![Animation with Perlin noise](/projects/algorithmic-drawing/algorithmic_drawing_6.jpg)

After experimenting a bit with this setup, I wondered what would happen if I gave the pen’s eyes, so they could see the lines they were drawing. I wanted to make them move freely, but avoid crossing the lines they had drawn.

![Single pen drawing process](/projects/algorithmic-drawing/algorithmic_drawing_7.jpg)

For this, I gave the pens a new vector that looked a certain distance in front of them in the direction they were moving and made them look at this point for any pixels that weren’t the color of the canvas. If they detect one, their velocity vector rotates 90°.

With the same grid as a starting point, they drew squares that became square spirals turning inward.

![Multiple pens drawing simultaneously](/projects/algorithmic-drawing/algorithmic_drawing_8.jpg)

To randomize each spiral, I gave each pen a new random value for the distance they could look ahead. That way they tuned earlier or later, leaving different amounts of empty space behind.

I also tried to randomize the angles that they turn or to shear and rotate the squares, but this led to the spirals breaking apart in unpredictable ways, probably, because the pixel detection doesn’t work that well when the vector crosses them at an angle. The pen’s behaviors when they came close to the center of the spiral also got irregular and they started to jitter around.

However, this led me to experiment with the lines in different settings. I let them start moving at a random place and interact with each other. To confine them I drew a grid of darker lines on the canvas, so the lines could see it as an obstacle, and drew over those lines with the background color at the end of each draw() loop to hide them.

![Square spirals with collision detection](/projects/algorithmic-drawing/algorithmic_drawing_9.jpg)

I also tried to have them oriented in different directions to start, with an offset of 45° and gave half of them the ability to turn left and the other half to turn right.

![Random movement with grid obstacles](/projects/algorithmic-drawing/algorithmic_drawing_10.jpg)

With this setting, I let the pens start from the corners of the canvas, removed the grid borders, and added a probability, at which the pen turns randomly. The lines that formed resembled connections on a circuit board.

![45° offset orientation](/projects/algorithmic-drawing/algorithmic_drawing_11.jpg)

I also tried to let them start drawing in a circle, with an edge at the border of the canvas and a circular border in the center.

![Circuit board pattern](/projects/algorithmic-drawing/algorithmic_drawing_12.jpg)

Another experiment was to let them grow randomly within a square. I also left the outline of a circle as a border in the middle.

![Circular border experiment](/projects/algorithmic-drawing/algorithmic_drawing_13.jpg)

### Summary

It was quite interesting to work with Vera Molnár's plotter drawing. It's fascinating how with just a tiny amount of disorder an ordered system can become something complex and visually appealing.

To first reproduce her work in processing was relatively simple, but to make processing draw in how I would imagine a plotter would draw, opened up a new appreciation for her work and algorithmic plotter art in general.

Setting up different starting positions and experimenting with obstacles or borders to constrain the movement was fun, but it was exciting to watch the computer draw its lines and let chance decide how the resulting image would look.

And even though the latest versions of my program were far from the starting point's appearance, I still see a connection to her plotter drawings in a broader sense.

</ProjectAccordion>
