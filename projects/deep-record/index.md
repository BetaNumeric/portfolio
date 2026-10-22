---
layout: project
title: Deep Record
year: "2019–2020"
description: "An interactive visualization of climate history and the time scales on which it changes."
tags: [Interactive]
heroImage: /projects/deep-record/climate_comparison.png
heroComponent: LumaHeroEmbed
heroEmbedUrl: "https://betanumeric.github.io/deep_record/"
heroEmbedTitle: "Deep Record Live Demo"
heroEmbedHeight: "72vh"
heroEmbedMinHeight: "500px"
heroEmbedMobileHeight: "70vh"
heroEmbedMobileMinHeight: "460px"
previewMedia: /projects/deep-record/age_of_universe_loop.mp4
gallery:
  - /projects/deep-record/deep_time.png
  - /projects/deep-record/orbit_loop.mp4
  - /projects/deep-record/solar_loop.mp4
  - /projects/deep-record/climate_comparison.png
  - /projects/deep-record/sea_level_loop.mp4
  - /projects/deep-record/volcanic_loop.mp4
  - /projects/deep-record/age_of_universe_loop.mp4
  - /projects/deep-record/comparing_datasets.mp4
  - /projects/deep-record/population_loop.mp4
---

<ProjectIntro image="/projects/deep-record/comparing_datasets.mp4" alt="Atmospheric carbon dioxide and global temperature displayed on a shared timeline in Deep Record" externalLink="https://betanumeric.github.io/deep_record/"> 

**DESCRIPTION**

In this project, I programmed an interactive visualization of climate history. Different datasets can be compared with global temperature while zooming between recent observations and the distant past.

My goal was to make the time scales of these changes easier to understand and relate them to human experience.

</ProjectIntro>

<ProjectAccordion :alwaysOpen="true">

I started Deep Record in 2019 and developed the original program in Processing during the winter semester of 2019/20. The interactive version shown here is a later adaptation for the browser.

While researching climate change, I was interested in the argument that the climate has always changed. I wanted to look more closely at the factors involved in these changes and how they relate to the time in which they happen.

Climate reconstructions often show graphs with different time scales next to each other. This makes it possible to show both the details of recent decades and the changes over millions of years without drawing an extremely long graph. But it also makes it difficult to get a sense of how these periods relate to each other.

I wanted to let the user stretch and compress the time axis themselves. At any point, the data is displayed on a linear scale, so equal distances represent equal amounts of time. The field of view changes logarithmically, allowing the user to move between very different scales without losing that relationship within the graph.

The temperature stays in the lower part of the screen. Above it, other datasets can be selected for comparison. A timeline underneath the graphs shows historical events and periods, giving familiar points of reference as the view moves further into the past.

![Carbon dioxide and temperature reconstructions at a wider time scale in the current web version](/projects/deep-record/deep_time.png)

*Web version, shown at a wider time scale.*

The question of how we understand time later continued in [Time Scale](/projects/time-scale/), where I expanded the idea beyond climate data to explore durations, cycles, and events in both the past and the future.

</ProjectAccordion>

<ProjectAccordion title="Development">

In Processing, I first experimented with reading and displaying the datasets. I tried using Bézier curves to smooth the lines and filling the area underneath them, but the curves caused problems with gaps and unevenly spaced data points. A simple line graph changed the appearance of the data less and worked better for comparing one dataset with another.

I then programmed the time axis and a class for events, which could represent either a point in time or a period. Mouse dragging, the scroll wheel, or the arrow keys change a variable that determines the width of a year. The graphs and events stretch or compress accordingly.

![Timeline and historical events in the original Processing version, 2019–2020](/projects/deep-record/original_timeline.png)

*The timeline in the original Processing version, 2019–2020.*

The datasets came in different formats and used different ways of writing dates. I converted them into separate CSV tables so I could add or replace a dataset without changing the rest of the program. For the original time axis, I used 1950 as the reference point, with months and days represented as fractions of a year.

Some tables contained thousands or tens of thousands of rows, and drawing all of them at once slowed the program down considerably. To make it faster, I only redrew the image when something changed, limited the drawing to the visible part of the data, and skipped points that became too close together on the screen.

The vertical range can also adjust to the values visible in the current view. This helps when the same dataset has very different values in the distant and recent past.

To compare the graphs more directly, I made it possible to drag the upper graph over the temperature graph. When released, it returns to its original position. The cursor connects a date on the timeline with the corresponding values in both graphs and displays their units.

![Temperature and other data overlaid for comparison](/projects/deep-record/compare_slim.mp4)
*Comparing temperature and other data*

I initially considered dividing the datasets into causes and effects, but decided against it because a variable such as CO₂ can be involved in both. Instead, I placed the available datasets next to each other in a simple selection bar.

</ProjectAccordion>

<ProjectAccordion title="Web Version">

I later adapted the program for the browser using p5.js, keeping the same basic interaction and adding newer datasets. The current version compares global temperature with atmospheric CO₂, sea level, solar irradiance, orbital eccentricity, volcanic aerosols, or world population.

A [scheduled GitHub Actions workflow](https://github.com/BetaNumeric/deep_record/blob/main/.github/workflows/update-climate-data.yml) also checks the current observations twice a month and automatically publishes validated updates. This keeps the recent end of the timeline current without me having to replace the data by hand.

You can scroll, pinch, or drag horizontally to change the time scale, and select a comparison using the buttons at the top. Hovering over a graph or tapping it shows values, dates, and sources. Dragging the upper graph down lets it overlap with temperature. The timeline labels also open information about the events and periods they represent.

The records cover different periods and have different resolutions. Source changes are marked in the graphs, and shaded areas show the uncertainties reported for the individual records. Zooming in does not create more detailed observations, and a visual similarity between two curves does not by itself establish a cause.

The [live program](https://betanumeric.github.io/deep_record/) includes a guide to the data and controls. The [source notes](https://github.com/BetaNumeric/deep_record/blob/main/data/SOURCES.md) describe the datasets, reference conversions, and limitations, and the code is available on [GitHub](https://github.com/BetaNumeric/deep_record).

I also explored climate data in [Climate Spiral](/projects/climate-spiral/), which represents monthly records as an interactive three-dimensional form.

</ProjectAccordion>

<ProjectAccordion title="Reflection">

With the original project, I hoped that letting people investigate the data themselves might help address misconceptions about climate change. It also made me think about the limits of that approach. Giving someone access to data does not necessarily change the way they interpret it, especially when the subject is closely connected to their worldview.

For me, the project was a way to learn more about climate research and the visualization of data. It also opened up the broader question of how to make time understandable, which I continued to explore in [Time Scale](/projects/time-scale/).

</ProjectAccordion>
