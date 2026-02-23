---
layout: project
title: The DIGIHUB's Nervous System
year: 2021
description: "An investigation of opportunities that could arise from installing sensors in the lighting system of buildings."
heroImage: /projects/digihub/digihub_close.jpg
previewMedia: /projects/digihub/dreaming_building.gif

gallery:
  - /projects/digihub/dreaming_building_2.jpg
  - /projects/digihub/miniature_in_floor_2.jpg
  - /projects/digihub/miniature.jpg
  - /projects/digihub/digihub_first_floor.jpg
---

<ProjectIntro image="/projects/digihub/digihub_model.gif" fullVideo="https://youtu.be/WccKi07Vsys">

**DESCRIPTION**

As digital media students, we have been asked to make some contributions to the design of the new [DIGITAL HUB Industry](https://digitalhubindustry.de/) building that is currently under construction.I chose to look into possibilities that could arise by installing sensors in the lighting system of the DIGIHUB.

</ProjectIntro>

<ProjectAccordion :alwaysOpen="true" :centerImages="true">

Though seeming lifeless and still, buildings are more like a living organism than mere dead matter. They breathe through their ventilation systems, produce their own body heat, various fluids flow through their "veins", and signals through their "nerve cords". So far we have been the "messenger substances" that carry information through their bodies and controll their organs. But what if we give the building senses and its own intelligence?

The technology park on the campus of the University of Bremen is getting a new building, the DIGITAL HUB Industry. This is a place for different companies that deal with digitization in industry, R&D projects at the university, start-ups, and Bremen students to work together. I thought it would be fitting to equip it with sensors, conect it to the internet and make it "smart".

I figured the best place to install sensors is in the lighting system, since in buildings light is radiated wherever people are. So the idea is to equip the lamps in the DIGIHUB with sensors such as infrared or distance sensors for room occupancy, but possibly also at least one lamp per room with brightness, air quality, sound level, temperature, and humidity sensors and to then connect these to the internet to anonymously measure, visualize and analyze the use of the building and control devices based on this information.

The connection to the internet (or a local server) could work wirelessly via Wifi, or with a routed Ethernet cable. It is also possible to supply the energy-saving LED lamps with power directly via the Ethernet cable in order to receive the sensor data and control the lamp at the same time.

For the data visualization, a 3D model could be fed with the sensor data and thus the current use of space, the air quality, noise level, temperature etc. could be displayed and analyzed through a visualization of the (average) usage over longer periods of time.

This model could exist digitally and it could also stand in the DIGIHUB as a real miniature model of the building equipped with small LEDs. The miniature could also be divided into layers and be installed in the corresponding story of the building. Either on the wall or built into the floor and thus also serve as orientation.

![floor miniature](/projects/digihub/miniature_in_floor.jpg)

Since the lamps would be connected to the Internet, they could also be controlled as a linked system. The brightness and, depending on the LEDs installed, the color temperature could be individually adjusted and controlled for the entire building. A personalized light setting could follow the person through the building and maybe mix with the values ​​of others to an average value when they meet.

For this function, Bluetooth transmitters could be built into the lamps, which then send out their IDs. A smartphone app could then use the signal strengths of the IDs to recognize its current position in the building and then send the user’s preferences to the lamps.

This could also make an indoor navigation system for the DIGIHUB possible, to find your way around the building or to ask about the whereabouts of others in the building. (Indoor positioning system)

The Bluetooth transmitters could also be used to track assets such as borrowable projectors or computers in the building by equipping them with small chips that communicate with the lamps.

It would also be possible to send out the lamp's ID with an for humans imperceptible flickering of their LEDs. (VLC) This flickering could then be read with a mobile phone camera in order to determine the current position in the building. With this principle, you could also establish a wireless Internet connection anywhere in the building where the lamps shine.

The smartphone app could also be used to reserve workplaces and you could connect your work schedule to it. This way, your office could be warmed up and the lights switched on before arrival.

In addition, cleaning staff could use the app to clean specifically there, where many people have recently been.

By successively dimming the lamps, people could also be guided individually through the building. In an emergency they could display the shortest route to the nearest emergency exit and the sensors could be used to search for people who are still in the building.

At night, the lamps in the empty outer rooms could be used for a light installation similar to the "Blinkenlight Project" by the Chaos Computer Club. A kind of screen saver at night in which the data of the day may be visualized. A dreaming building.


![dreaming building](/projects/digihub/dreaming_building.jpg)

After some time, the data obtained from the sensor lamps could be used to change the allocation of the rooms, for example to shorten frequent walking distances or to design them in such a way that people from different departments can meet and exchange more frequently.

Perhaps it would also be possible with the help of machine learning to use the data in such a way that an artificial intelligence controls the DIGIHUB, an AI that can recognize and predict walking patterns and thus manage the resources in an energy-saving way and switch on lamps and other devices even before a room is entered.

</ProjectAccordion>



<ProjectAccordion title="Development" :centerImages="true">

To visualize these ideas, I constructed a 3D model of the interior according to the original blueprint provided by [GMD Architekten](https://www.gmd-architekten.com/) with Fusion 360 and used Blender and After Effects to animate the lighting.

![lamps in building](/projects/digihub/lamps.jpg)

On the construction site I have worked with various scanning methods such as photogrammetry and omnidirectional cameras.

![drone elevation map](/projects/digihub/digihub_elevation_drone.jpg)

I also tried out various 3D architecture software to animate how the sensors could improve the DIGIHUB.

![3D architecture software](/projects/digihub/software.jpg)


</ProjectAccordion>
