---
layout: project
title: Time Scale
year: 2022
description: "A visualization of the past, the future and the now to give a sense of scale."
heroImage: /projects/time-scale/galactic_year.jpg
heroComponent: TimeScaleEmbed
previewMedia: /projects/time-scale/zoom.gif
gallery:
  - /projects/time-scale/gallery/500ms.jpg
  - /projects/time-scale/gallery/geologic_time_scale.jpg
  - /projects/time-scale/gallery/giga-annum_future.jpg
  - /projects/time-scale/gallery/presentation_1.jpg
---

<ProjectIntro image="/projects/time-scale/ten_seconds.gif" externalLink="https://betanumeric.github.io/time/">

**DESCRIPTION**

In this project, I programmed an interactive timeline, with which one can explore both the distant past and the far future, the long and the short, and their relationship to each other and with the now.

My goal was to help better understand our size and place in the temporal dimension of our universe.

The project was inspired, among other things, by Charles and Ray Eames' short film "Powers of Ten" (1968) which was based on Kees Boeke's book "Cosmic View: The Universe in 40 Jumps" (1957).

</ProjectIntro>

<ProjectAccordion title="Read More">
Displaying data over a very wide range of values is usually done with a logarithmic scale. This however distorts the visualization and usually doesn't make intuitive sense.

So for my visualization I wanted to display the data linearly at any point in time, but make the viewer be able to manipulate the field of view logarithmically. That way a more complete understanding of the data can emerge.

Similar to how programs like Google Earth can give us a better idea of the space around us, by allowing the user to zoom in and out, I hope my program can help build a better mental map of the time that surrounds us


</ProjectAccordion>

<ProjectAccordion title="Development">

I first used Processing (Java) to write the program and later switched to the p5.js JavaScript library to better implement it online.

The program displays a horizontal timeline. The timeline goes left to right from the past into the future. I chose that direction because it is the dominant reading direction in most cultures and it's better suited to most screens on desktop computers than using a bottom-to-top version (which would better correlate with geological strata going further back in time, the lower they are).

There is one scale at the bottom that changes between different units we commonly use (seconds, minutes, hours, days, years) and a stationary time scale at the top that only uses the SI-Unit "second" with different prefixes (e.g. Mega, milli, nano, ...) and with the scientific notation (×10^n) for numbers so big or small, they don't have prefixes yet.

Dragging changes the field of view. This is mostly done in a way that the point the mouse is dragging stays underneath the cursor, however as it gets closer to zero the dragging changes the field of view linearly, because otherwise it would set all points to zero once the cursor reaches zero on the timeline.

Depending on where the drag starts it continues linearly in the same direction once it crosses zero.

At zero is a vertical line that represents the present, an “axis of symmetry” between the past and the future. It can be dragged left or right, to make either side more visible, but it always stays in view. When clicked on its center box it switches between two modes. One mode has the axis at zero with negative numbers to the left and positive to the right. The other sets the axis to the current date and time of the Gregorian calendar and the system's time zone. This mode consequently has the timeline move to the left with each millisecond that passes.

To visualize the cyclical time units we ordinarily use to measure time (rotation of clock hands, revolution of earth around its axis, earth's orbit around sun) I draw waves on the axis that themselves are made up of waves of the smaller unit and follow waves of the next bigger unit.


![one day](/projects/time-scale/day.jpg)

When hovering over the axis, a menu appears and different dataset can be selected to be displayed.

There are multiple data types that can be displayed in the program (loaded from csv tables).

There are the time spans, which depict the duration of something (e.g. blink of an eye, average human lifespan, half life of Uranium-235). I draw them with a rectangle whose width is always equal to the length of time it represents on the time scale.

Because it doesn't have a fixed starting point on the timeline, it always stays in the center of the screen. Only if the now-axis is outside of that range, it uses the zero-point as a start or end point, for better measurability.

The height changes as you zoom in or out and it disappears either when it gets too big for the window or when it shrinks behind the now axis box.

To visualize cyclically repeating events (e. g. Moon's orbital period, Caesium-133 oscillation, Galactic year) I use a sine wave. The wave starts at the now axis and its wavelength is the event's cycle time. The wave's amplitude gets smaller as its frequency shrinks until it is a line and fades away.

At the top of the screen I included a list of geological eons, eras, periods and epochs. They only show up when they're in relevant view and are color coded according to the International Commission on Stratigraphy (ICS).

![one galactic year](/projects/time-scale/galactic_year.jpg)

Then there are the time points, which are for events that happened in the past or are predicted to happen in the future (e.g. Moon landing, Abiogenesis, complete erosion of Niagara Falls). I mark them with a pin in the timeline with the event name in the head of the pin. They disappear either out of view or behind the now axis.

For an event that occurs over a time span I draw a pin with two needles marking the beginning and end of its duration.

I also included image sequences that depict change over time (e.g. tectonic plate shift). These can be dragged and pulled within their time span. They also stay in view when the now axis or the edge of the window gets too close, by moving along their timeline.

Hovering over the events or clicking on them can show additional information, the exact time or a link to the source.

![presentation](/projects/time-scale/presentation_3.jpg)

To present the program I used two projectors, each facing a different wall, connected at the edge. The past and the future were at a right angle to each other, connected in the corner. In the middle I put a mouse on a pedestal to interact with the timeline. My intention was for it to be more immersive, by wrapping around the room and having depth to it.

</ProjectAccordion>
