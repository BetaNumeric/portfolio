---
layout: project
title: Auscultation of Water
year: 2019
description: "An installation that lets you listen to a heartbeat generated with water droplets."
heroImage: /projects/auscultation_of_water/flasks_web.jpg
previewMedia: /projects/auscultation_of_water/auscultation_of_water_drops.gif

gallery:
  - /projects/auscultation_of_water/flask_top_web.jpg
  - /projects/auscultation_of_water/drops_web.jpg
  - /projects/auscultation_of_water/flask_back_web.jpg
  - /projects/auscultation_of_water/flask_web.jpg
---

<ProjectIntro image="/projects/auscultation_of_water/auscultation_of_water.gif" fullVideo="https://vimeo.com/369176904">

**DESCRIPTION**

This machine lets you listen to the heartbeat of water through a stethoscope.

The "heartrate" is affected by the surrounding noise and decreaces with silence.


</ProjectIntro>

<ProjectAccordion :alwaysOpen="true"  :centerImages="true">

It uses Arduino driven solenoid valves to control the flow of a siphon, forming droplets that produce a distinct sound upon impact with the water in a glass. With a stethoscope attached to the bottom glass one can listen to the sound of the water.

![water drops](/projects/auscultation_of_water/auscultation_of_water_drops.gif)

The “heart rate” is affected by the surrounding noise which is measured by a small microphone. Loud noise causes the pulse to increase, while silence slowly calms it down again. After a specific number of drops, a pump turns on, refilling the upper glass, completing the cycle.

</ProjectAccordion>



<ProjectAccordion title="Development" :centerImages="true">

First I did some experiments with different solenoid valve nozzle sizes to find out how to make a good sound with water.

![testing](/projects/auscultation_of_water/development/0_testing.jpg)

I tested with different droplet sizes, different drop heights, and different water depth.

![testing](/projects/auscultation_of_water/development/1_testing.jpg)

After I figured out what the right values are I made a rough sketch in Photoshop. Then I made a 3D Model with the correct sizes of the parts in Fusion 360. To increase the volume of the droplet sound I put a speaker as a place holder.

After some testing, I also decided to put the valves on top of the siphon to reduce the clicking sound they make and also because it’s a good idea to have the electronics above the water in a case of leakage.

![sketch](/projects/auscultation_of_water/development/2_sketch.png) 

I got the material and started by cutting a thin piece of stainless steel to connect the glass flasks and bent the ends with a hammer.

![cutting metal](/projects/auscultation_of_water/development/3_cut_and_bend_bar.jpg)

Then I drilled holes for screws in both ends.

![drilling bars](/projects/auscultation_of_water/development/4_bars.jpg)

I measured and drilled holes 120° apart in the lid and screwed the bars to the flask.

![lid holes](/projects/auscultation_of_water/development/5_lid_holes.jpg)

The metal lid was rather thin and the flask was wobbling a bit, so I decided to strengthen it with a thicker piece of metal on the inside.

I cut it out and drilled threaded holes in it. I shortened the screws and with the new plates, I was able to screw the two flasks sturdily together.

![reinforcements](/projects/auscultation_of_water/development/6_reinforcement.jpg)

Then I drilled holes for the valves and tubes in the plates and the lids.

![valve holes](/projects/auscultation_of_water/development/7_valve_holes.jpg)

I used thread sealing tape, to prevent leakage of the valves.

![sealing tape](/projects/auscultation_of_water/development/8_sealing_tape.jpg)

To prevent the whole machine from tipping over I cut off a tight-fitting metal pipe and cut a slit in it to make it bendable.

I then used the leftover parts from the connection bars and bent them to a 90° angle.

![stand parts](/projects/auscultation_of_water/development/9_stand_parts.jpg)

I drilled holes in the pipe part and welded the angles through the drill holes on it.

![stand assembly](/projects/auscultation_of_water/development/10_stand_assembly.jpg)

Then I designed a box for the electronics out of cardboard. I went through a few different designs...

![cardboard designs](/projects/auscultation_of_water/development/11_cardboard_designs.jpg)

...and ended up with a simple material-saving version, that can be screwed on with the solenoid valves.

![cardboard design](/projects/auscultation_of_water/development/12_cardboard_design.jpg)

I also installed a switch next to the up-facing water pump. I didn't use the submersible water pump, because it would have been too loud to have it in the bottom flask, it would be in the way of the droplets and also that way all the electronics are close together. To keep the pump in place I used a piece I cut from a rubber tube.

![switch and pump](/projects/auscultation_of_water/development/13_switch_and_pump.jpg)

After finishing the cardboard model, I cut out and bent a thin piece of stainless steel to the same proportions.

![cardboard to steel](/projects/auscultation_of_water/development/14_cardboard_steel.jpg)

Then I drilled holes for the valves, tubes and for the pump and cut a hole for the switch and drilled holes for the screws and cables.

![drilling_holes](/projects/auscultation_of_water/development/15_drilling_holes.jpg)

After that I assebled all parts of the machine.
 
<div class="embed-container">
  <iframe title="vimeo-player" src="https://player.vimeo.com/video/369177681?h=ef6c36b0fb&title=0&byline=0&portrait=0" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
</div>

I screwed on the Arduino and the h-bridges, attached the pump, soldered the cables and connected it with the switch, put the tubes through their holes and screwed the whole thing with the valves holding it on the top lid.

When I screwed the electronic parts to the metal, I cut small pieces of the leftover tubes, to keep the boards at a save distance to the metal, to prevent shortcircuits.

![electronics](/projects/auscultation_of_water/development/16_electronics.jpg)

Even though the solenoid valves were on the very top, their clicking sound was propagating through the metal connector rods into the bottom flask and was heard loudly through the stethoscope. To dampen the sound they made, I disassembled them and experimented with how much dampening material I could fit in before the electromagnet stopped being able to move the piston.

I ended up using two layers of duct tape at the end of the pistons and this decreased their sound significantly.

![valve disassembled](/projects/auscultation_of_water/development/17_valve_disassembled.jpg)

To decrease the propagation of the soundwaves through the metal, I widened the holes in the three connectors and put rubber rings between them, the screws, and the lid.

I also made holes in the connector for the tube to fit through, for symmetry.

![rubber rings](/projects/auscultation_of_water/development/18_rubber_rings.jpg)

And I installed a small piece of metal on the inside of the bottom flask, for the pump tube to fit through, so that it gets pressed against the glass and doesn’t interfere with the falling droplets.

![tube bender](/projects/auscultation_of_water/development/19_tube_bender.jpg)

I also made some changes in the program so that the microphone won't listen to the clicking valves, by making it deaf to the amplitude they produce while they're activated. During that time it only listens to what's louder than that.
 
</ProjectAccordion>
