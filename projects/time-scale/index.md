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

![Laser pointing at North Star](/projects/time-scale/day.jpg)



</ProjectAccordion>
