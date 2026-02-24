---
layout: project
title: Timid Mirror
year: 2020
description: "This machine is a swivel mirror that can detect faces and tilt and rotate away to avoid eye-contact with them."
heroImage: /projects/timid_mirror/timid_mirror_front_web.jpg
previewMedia: /projects/timid_mirror/timid_mirror.mp4

gallery:
  - /projects/timid_mirror/timid_mirror_back_web.jpg
  - /projects/timid_mirror/timid_mirror_rotation_web.jpg
  - /projects/timid_mirror/timid_mirror_side_web.jpg
  - /projects/timid_mirror/timid_mirror_tilt_back_web.jpg
  - /projects/timid_mirror/timid_mirror_front_web.jpg
  - /projects/timid_mirror/timid_mirror.gif
  - /projects/timid_mirror/timid_mirror_tilt_side_web.jpg
---

<ProjectIntro image="/projects/timid_mirror/timid_mirror.gif" fullVideo="https://vimeo.com/506756998">

**DESCRIPTION**

This mirror can’t maintain eye contact.

It's a machine that is only useful when turned off.

The idea was to use an everyday object and make it act in an unexpected, human way.

We often try to give the machines and robots we build more human traits. In this case, humanization makes the tool useless.

</ProjectIntro>

<ProjectAccordion :alwaysOpen="true">

This machine is a swivel mirror that can detect faces and tilt and rotate away to avoid eye-contact with them.

The mirror "sees" with an ESP32 camera, which connects to a Wi-Fi network and runs a face detection algorithm. Depending on where on the image sensor a face is detected the ESP32 either sends a signal to turn the whole machine clockwise or counterclockwise until the face is no longer in view. The two signals go into an H-bridge, which switches the polarity of a geared DC motor.

The motor’s axis is loosely going through a hole in the bottom middle of the mirror’s stand and sticks fixed in a round wooden plate below the machine. That way all the electronics are on the mirror and it can rotate indefinitely without tangling up connected cables.

![side view](/projects/timid_mirror/timid_mirror_tilt_side_web.jpg)

When the machine sees a face it also looks down as if ashamed. To make that motion I used a servo motor, which sticks out to the side through a square hole in the mirror’s stand. Its axis is connected to a lever that transfers the motion to another lever connected to an extended axis of the mirror. It is controlled with an Arduino Nano that gets a signal from the ESP32 whenever a face is detected. The Arduino Nano quickly tilts the mirror down and it stays that way for a moment or as long as a face is detected. Once the face is gone it slowly and cautiously returns to its original state

To power the machine I used a 7.2V battery pack controlled by a switch button and connected to the H-bridge for the motors and Arduino Nano and to a 5V power bank for the ESP32 cam.

</ProjectAccordion>



<ProjectAccordion title="Development">

For the mirror, I used a wooden bathroom swivel mirror, because it already looked a bit more lively compared to a bigger stationary mirror, and it had more space for the electronics than the metal and plastic options.

The mirror had two sides, of which I only used the undistorted one. I hid the other one by cutting out and gluing a piece of cardboard with similar color, to the wood of the mirror.

I cut out a round piece of wood and drilled a semi hole in the middle.

![mirror stand with dc motor](/projects/timid_mirror/stand.jpg)

For the motor’s axis to stick through I drilled a hole in the wooden mounting of the mirror.

And to fasten the motor I drilled another hole next to it and countersunk the screw so it doesn’t obstruct the motion.

![dc motor rotation test](/projects/timid_mirror/rotation_test_loop.mp4)

On the side, I drilled a hole and sanded it square for the servo motor to fit through.

![hole for servo](/projects/timid_mirror/servo.jpg)

For the lever, I cut out two pieces of plastic and filed the corners. I then drilled holes in them and countersunk one on each.

I used a slightly longer screw on one side of the mounting for the axis of the mirror and used two nuts to lock the lever in between.

The other lever is tightly stuck on the axis of the servo motor.

To connect the two levers I used a piece of a cable tie with two holes and shortened screws with nuts.

![servo tilt test](/projects/timid_mirror/tilt_test_loop.mp4)

At first I put the ESP32 Cam on the cardboard, with the connection cable stiffened by a piece of cardboard, in a way that the lens looked over the edge of the mirror.

![ESP32 cam](/projects/timid_mirror/camera.jpg)

The wide angle lens however turned out to be less useful, since the mirror has only a rather narrow "field of view".

Below the mirror and on both sides of the DC motor I tried to put a lot of the electronics, because I didn't want to put too much weight on the backside of the mirror.

![electronics at base](/projects/timid_mirror/electronics.jpg)

The cables for power supply and signals go up and down on the sides of the stand and are taped close to the tilting axis of the mirror, so that they don't need to move that much.

To program the ESP32 I used an Arduino Uno.

![electronics at the back](/projects/timid_mirror/programming.jpg)

A big problem I had was the power supply. Since it had to turn freely, I couldn't use a cable or otherwise it would get tangled. So I tried using a single small 5V USB power bank that I could attach on one side of the mirror's stand.

The problem was that the Arduino Nano has a recommended input voltage of 7-12V, the geared DC motor was supposed to be powered with 12V, the servo 5V and the camera also 5V.

Measuring the actual voltage of the power bank resulted in 4.7V. I replaced the power bank with a 7.2V battery pack from an RC model and used a PWM DC voltage regulator for the 5V components.

This didn't work, because the ESP module didn't like the PWM signal. I tried to do it with a simple voltage divider made with 3 resistors. It did work in this configuration for short periods of time, but as soon as a motor turned on, the camera suffered a brownout.

I ended up using the built-in 5V power supply of the L298N H-bridge to power the servo and used a power bank only for the ESP32 camera.

This way it now works reliably.

![spinning timid mirror](/projects/timid_mirror/timid_mirror.mp4)

</ProjectAccordion>
