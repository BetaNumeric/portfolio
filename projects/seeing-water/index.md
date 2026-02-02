---
layout: project
title: Seeing Water
year: 2020
description: "An installation exploring the visual nature of water and its relationship to the eye."
heroImage: /projects/seeing-water/header.jpg
previewMedia: /projects/seeing-water/seeing_water.mp4
gallery:
  - /projects/seeing-water/gallery/seeing_water_0.jpg
  - /projects/seeing-water/gallery/seeing_water_1.jpg
  - /projects/seeing-water/gallery/seeing_water_2.jpg
  - /projects/seeing-water/gallery/seeing_water_3.jpg
  - /projects/seeing-water/gallery/seeing_water_4.jpg
  - /projects/seeing-water/gallery/seeing_water_5.jpg
---

<ProjectIntro video="/projects/seeing-water/seeing_water.mp4" stillImage="/projects/seeing-water/seeing_water_still.jpg" fullVideo="https://youtu.be/1zrsLcYZ11E">

**DESCRIPTION**

In this installation, I want to show the deep connection between water and our ability to see, but also point out the urgent necessity to look at this transparent substance and see.
  
I examined the visual nature of water and its relationship to the eye. Like the lens behind the pupil, I used water's refractive properties to focus the image of an eye.

</ProjectIntro>

<ProjectAccordion title="Read More">

Water defines the way we see. The spectrum of visible light is a remnant from a time when all life was surrounded by water. When eyes developed, they adapted to the only part of the electromagnetic spectrum that could penetrate water without being absorbed. That's why water is transparent. As eyes evolved, they started to use water as a refractive, deformable material to let in more light and focus the world around us.

In today's industrialized world water has become invisible. Not because of its transparency, but in the way we use it and get used to it. Hidden in walls and underground, water is accessible from everywhere. Used in closed machines and hidden in the production lines of the products we consume every day.

Looking at water reveals fundamental changes our ecosystem goes through and in it we see the reflection of our behavior and actions. The temperatures of the seas are increasing, the frozen waters on the poles and mountains are melting, oceans are filling up with unbiodegradable plastics and acidifying as they absorb anthropogenic CO2. As the sea level rises and the temperatures increase, the global distribution of water is changing drastically.

![seeing water example 1](/projects/seeing-water/seeing_water_example_1.jpg)

In my installation, I want to show the deep connection between water and our ability to see, but also point out the urgent necessity to look at this transparent substance and see.

</ProjectAccordion>

<ProjectAccordion title="Development">

<div class="video-container">
  <iframe width="560" height="315" src="https://www.youtube.com/embed/uOOmZvK5XgE" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

I experimented with the visual properties of water droplets, by attaching one to a piece of wire and trying to focus my eye inside the droplet.

![development](/projects/seeing-water/development/dev_1.jpg)

I discovered that to frame it, I had to get very close because otherwise, my whole face would appear inside the droplet. I also had to set the focus slightly in front of the drop, to get the background sharp. To also get the outline of the droplet I had to narrow the aperture. I wanted to have a high difference in sharpness and blurriness of the background in and outside the droplets, to demonstrate the refracting properties of water. Therefore I had to move the background further away from the droplet and enlarge the image of the eye.

![development](/projects/seeing-water/development/dev_2.jpg)

The next thing I tried was to automatically freeze a moving droplet with my camera. For that, I used a 12-volt solenoid valve, an H-bridge and an Arduino.

![development](/projects/seeing-water/development/dev_3.jpg)

I connected the valve to a siphon from a water bottle and attached it above a water container.
With a processing sketch on my computer, I told the Arduino to open the valve with the H-bridge for a few milliseconds and then close it again. A few milliseconds later the program made the Arduino close a circuit connected to my camera, to trigger the shutter release.

![development](/projects/seeing-water/development/dev_4.jpg)

I tested different printed out background images of eyes and with my own eye. 

![development](/projects/seeing-water/development/dev_5.jpg)

I also tried mixing the water with guar gum powder, to change its viscosity. This caused some interesting strings of liquid to form, attached to small droplets trying to fly away from the impact “crown”.

![development](/projects/seeing-water/development/dev_6.jpg)

I got rid of the discoloration of the water by using refined Xanthan gum, used as a treatment for dysphagia. But there were still small particles in the water so I switched back to pure water.

![seeing water eye](/projects/seeing-water/seeing_water_header.jpg)

To better control the background, I tried to use a monitor instead of printed out photos. But to freeze the short moment of weightlessness, the camera needs a lot of light and even with a high ISO and the highest shutter speed, I wasn’t able to freeze the droplet as good as with a flash. And using a flash against the display only caused it to reflect the light and blow out the image.
To solve this problem, I took apart a liquid crystal display and removed the backlight.

![development](/projects/seeing-water/development/dev_7.jpg)

I connected it to a computer and built a test frame out of cardboard.

![development](/projects/seeing-water/development/dev_9.jpg)

I put white acrylic glass behind the crystals to smoothen the light and put the motherboard and buttons on top of the box, so it wouldn't be in the way.

![development](/projects/seeing-water/development/dev_10.jpg)

I did some testing with the valve and a camera flash. 

![development](/projects/seeing-water/development/dev_11.jpg)

It worked pretty well, but because the flash wasn't completely covered, it left a squared halo around the box, which was visible in the droplet

The next step was to make a more robust box out of metal. 
I designed a box, that would attach to the display, and had metal sheets bent in shape.
To make it easy to disassemble, they slide into each other.

![development](/projects/seeing-water/development/dev_12.jpg)

I drilled holes in one side for the buttons and cables, and holes for screws.

![development](/projects/seeing-water/development/dev_13.jpg)

To fixate the circuit board, I used an aluminum plate. With small pieces from a tube, I separate it from the plate, to prevent short circuits.

![development](/projects/seeing-water/development/dev_14.jpg)

I did some testing and decided to put it near the top inside the box, in a way that it wouldnt interfere with the light from the flash.

![development](/projects/seeing-water/development/dev_15.jpg)

I did have some problems with faulty lines on the display, due to loose connections, but was able to get rid of them by loosening a tight screw and carefully pushing on the wires.

![development](/projects/seeing-water/development/dev_16.jpg)

The ribbon cable, that connects the buttons to the circuit board was too tight for this configuration and broke after a while, so I had to replace it with wire.

![development](/projects/seeing-water/development/dev_18.jpg)

For the flash, I cut a hole in the middle of the back with an angle grinder.

![development](/projects/seeing-water/development/dev_19.jpg)

To make adjusting the image on the otherwise black display easier, I installed an LED-stripe that can be turned on and of by the Arduino.

![development](/projects/seeing-water/development/dev_20.jpg)

In Processing, I wrote a program that lets me control the position of the image, the size of the droplet and the delay of the camera. I also added the option to turn on a vignette, to hide the "squareness" of the image in the droplet and let it better blend in with the dark background.

![development](/projects/seeing-water/development/dev_21.jpg)

For the exhibition I used an extra display connected to the camera, to present the images it just took.

</ProjectAccordion>




