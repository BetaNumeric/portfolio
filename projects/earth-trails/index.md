---
layout: project
title: Earth Trails
year: 2020
description: "A project to show Earth's movement as a planet through space from everyday perspectives."
heroImage: /projects/earth-trails/header.jpg
previewMedia: /projects/earth-trails/earth_trails_machine.gif
gallery:
  - /projects/earth-trails/gallery/earth_trails_0.jpg
  - /projects/earth-trails/gallery/earth_trails_1.jpg
  - /projects/earth-trails/gallery/earth_trails_2.jpg
  - /projects/earth-trails/gallery/earth_trails_3.jpg
  - /projects/earth-trails/gallery/earth_trails_4.jpg
---

<ProjectIntro image="/projects/earth-trails/earth_trails.gif" fullVideo="https://vimeo.com/491661972">

**DESCRIPTION**

With this project my goal was to show earth's movement as a planet through space from everyday perspectives that non-astronauts can relate to and remind that we're all traveling together on this tumbling rock through the vacuum of space.

</ProjectIntro>

<ProjectAccordion title="Read More">

Essentially the machine is a camera that uses a laser, a motor and gears to be stationary in respect to fixed stars and can thereby see the rotation of our planet.

To achieve this a geared DC motor turns a worm screw with a toothed belt. The worm screw transmits its motion to a worm wheel, which turns around its axis once every 23 hours and 56 minutes. During this one or multiple cameras are attached to the metal worm wheel, taking photos.

In the middle of the wheel is a hole with a green laser inside. When properly adjusted the laser always points to the north star "Polaris".

![Laser pointing at North Star](/projects/earth-trails/polaris_laser.jpg)

The DC motor is powered by an 18V battery, which is down-regulated to 5.8V with a PWM voltage control module. The cameras are powered by an external USB power bank which is also attached to the wheel. The shutter is controlled with a wired remote shutter release that fires every 30 seconds. The camera is in Aperture priority mode and depending on whether the earth is facing towards the sun or not the exposure time changes.

After recording a preferably cloud-, fog-, rain- and morning dew-less rotation and developing the RAW files I remove hot pixels with an action as a batch process in Photoshop. Then I import those new files as a sequence into After Effects and use two motion trackers on fixed stars to remove small variations in position and rotation. I export the frames as image sequence and video.

<div class="embed-container">
  <iframe title="vimeo-player" src="https://player.vimeo.com/video/494676533?h=ef6c36b0fb&title=0&byline=0&portrait=0" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
</div>

To create the Earth Trails as a video I use another batch process in Photoshop that adds with each step one of the stabilized images and blends them with the Lighten blend mode. In Media Encoder I then render this new sequence as a video. For the still Earth Trail images I use the Image Statistics script, where I import all photos and let Photoshop calculate the mean value for each pixel.

![stacked 360° view](/projects/earth-trails/360_mean_web.jpg)

3D model of the machine:

<div class="embed-container embed-3d">
  <iframe title="Earth Trails Scan" src="https://sketchfab.com/models/0c96bbe915c34d7b8b1b068e8fc41234/embed?ui_controls=0&ui_infos=0&ui_stop=0&preload=1&autostart=1" frameborder="0" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen></iframe>
</div>

</ProjectAccordion>

<ProjectAccordion title="Development">

The first Idea was to reduce the speed of a motor with multiple gears or a big wheel and a belt, but I soon realized that the easiest and most effective way to reduce the speed was to use a worm drive arrangement.

![sketches](/projects/earth-trails/development/sketches.jpg)

I used a metal lathe and a milling machine to create a wheel and its bearing.

![sketches](/projects/earth-trails/development/wheel.jpg)

I screwed it on a plate that I cut out of an old table.

![plate](/projects/earth-trails/development/plate.jpg)

With a tap and die and the lathe machine I made the worm screw and threaded the wheel. 

![threaded rod](/projects/earth-trails/development/threaded_rod.jpg)

For the worm screw I used a self-lubricating sintered bearing on a tiltable aluminium part.

![self lubricating bearing](/projects/earth-trails/development/self_lubricating_bearing.jpg)

For the motor I cut out a space in the metal part and used a spring to put tension on the belt.

![motor case](/projects/earth-trails/development/motor_case.jpg)

I put a gear on the end of the worm screw rod and attached the part to the plate. The rod is later pushed against the worm wheel with a rubber band.

![motor case attached](/projects/earth-trails/development/motor_case_attached.jpg)

The motor is pushed into its case and connected to the worm wheel rod with a toothed belt. A 18V battery is connected to a the motor with a voltage regulator in between.

![close up](/projects/earth-trails/development/close_up.jpg)

I welded together a tripod head, to rotate and tilt the device and put it on a wooden tripod.

![tripod attachment](/projects/earth-trails/development/tripod_attachment.jpg)

To figure out the needed voltage I counted the 622 teeth on the worm wheel and calculated how many rotations of the worm screw are needed. Then I recorded the rotation over one day and adjusted the voltage.

![rotation test](/projects/earth-trails/development/rotation_test.jpg)

To find the North Star, at first I used a telescopic sight that I put in the middle of the wheel’s axis. I fixated and adjusted it with three screws.

![telescopic sight](/projects/earth-trails/development/telescopic_sight.jpg)

I later switched it out with a green laser. The eye is particularly sensitive to the green color and the beam can unambiguously point to the North Star and be seen up to 2 km high reflecting of particles and water vapor in the peplosphere.

![laser](/projects/earth-trails/development/laser.jpg)

To get the rotation speed as accurate as possible I later also used a telephoto lens, made long exposure photos and fine-tuned the motor speed until the stars left no more trails.

![laser test](/projects/earth-trails/development/laser_test.jpg)

In the Videos I saw an approximately 2.5 minute oscillation in motor speed which I got rid of by tracking the stars in After Effects and stabilizing the video.

![rotation deviation](/projects/earth-trails/development/rotation_deviation.jpg)

Because of this digital image stabilization otherwise static hot pixels began to move and show up on layered photos. Since hot pixels look very similar to stars I couldn’t remove them with usual noise reduction without also removing the stars. So I recorded long exposure shots in complete darkness and combined the photos to one with just the hot pixels. With this map I created a Photoshop action that removes all hot pixels of my camera in a batch process.

![hot pixel removed](/projects/earth-trails/development/hot_pixel_process.jpg)

I tried different approaches to better visualize the movement of our planet with the material I collected. One was the time-lapse video that simply speeds it up to make it perceivable. Another was to add digital motion blur in After Effects to make a smoother fast moving Video.

![motion blur](/projects/earth-trails/development/motion_blur_still.jpg)

I also wanted to produce some still images that showed the rotation during the night. One way was to use the “Lighten” blending mode in Photoshop which just keeps the brightest pixels of all the photos. That way planes, satellites and shooting stars are also visible. The downside is that It only works at night and had there been any bright irregularity, it will be visible in the final image. I also created a Photoshop action to make a video out of this process.

![max](/projects/earth-trails/development/max.jpg)

Another option in Photoshop was to use the image statistics script. Here I could let Photoshop calculate the average value for each pixel. That way irregularities don’t show up and most of the noise is gone, too.

![mean](/projects/earth-trails/development/mean.jpg)

</ProjectAccordion>