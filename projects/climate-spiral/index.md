---
layout: project
title: Climate Spiral
year: 2026
description: "An interactive 3D visualization of climate data, with automatic updates and views of seasonal cycles and long-term change."
tags: [Interactive]
heroImage: /projects/climate-spiral/temperature_3d.png
heroComponent: LumaHeroEmbed
heroEmbedUrl: "https://betanumeric.github.io/climate_spiral/"
heroEmbedTitle: "Climate Spiral Live Demo"
heroEmbedDescription: "This demo loads from GitHub Pages, jsDelivr and Google Fonts. These services may use cookies and process your IP/device data outside the EU/EEA."
heroEmbedHeight: "72vh"
heroEmbedMinHeight: "500px"
heroEmbedMobileHeight: "70vh"
heroEmbedMobileMinHeight: "460px"
previewMedia: /projects/climate-spiral/unwrap_loop.mp4
gallery:
  - /projects/climate-spiral/temperature_3d.png
  - /projects/climate-spiral/sea_ice_volume_2.mp4
  - /projects/climate-spiral/climate_spiral_land.mp4
  - /projects/climate-spiral/co2.png
  - /projects/climate-spiral/unwrapped_front.png
  - /projects/climate-spiral/unwrap_loop.mp4
  - /projects/climate-spiral/climate_spiral_co2.mp4
  - /projects/climate-spiral/unwrapped_top.png
  - /projects/climate-spiral/climate_spiral_temperature.mp4
---

<ProjectIntro image="/projects/climate-spiral/climate-spiral.mp4" alt="Monthly global temperature anomalies forming a three-dimensional spiral, with more recent years near the top" externalLink="https://betanumeric.github.io/climate_spiral/">

**DESCRIPTION**

In this project, I programmed an interactive 3D visualization of climate data. Each turn of the spiral represents a year, with the months arranged around its center and the values determining the distance from it.

My goal was to make seasonal patterns and changes over successive years visible within the same form, and to keep the visualization current as new observations become available.

</ProjectIntro>

<ProjectAccordion :alwaysOpen="true">

The project builds on the climate spiral introduced by [Ed Hawkins in 2016](https://www.climate-lab-book.ac.uk/2016/spiralling-global-temperatures/). I created an interactive version that lets the user move around the visualization, change the dataset, and switch between a spiral and an unwrapped view.

Seen from above, the years overlap like rings, showing how the values change at different points in the calendar. In the default temperature view, color also follows the value, with cooler anomalies shown in blue and warmer ones in red.

![Global temperature anomalies seen from above, with the months arranged around the spiral](/projects/climate-spiral/climate_spiral_temperature.mp4)

When viewed from the side, the years are separated vertically. The same line becomes a spatial record that can be rotated and examined from different angles. Moving between the views changes which relationships become easiest to see, while the underlying observations stay the same.

The animation draws the record month by month. It can be paused and moved backward or forward, making it possible to look at one part of the record or watch how the whole shape develops over time.

Keeping the data current was also important to me. I set up a [GitHub Actions workflow](https://github.com/BetaNumeric/climate_spiral/blob/main/.github/workflows/update-climate-data.yml) that checks the main climate datasets every week, downloads the latest files, validates them, and saves any changes automatically. The visualization can keep growing with new observations without relying on me to update the data by hand.

This project sits alongside [Deep Record](/projects/deep-record/), which explores climate history across a much wider time range. Here, I focused on the repeating structure of the year and the changes that accumulate across those repetitions.

</ProjectAccordion>

<ProjectAccordion title="Interaction and Views">

I built the program with Three.js so the visualization can be explored directly in the browser. Dragging rotates the view, while scrolling or pinching moves closer to or further from the form. The camera can also snap to top and side views, making it easier to return to a familiar orientation after moving around it.

The Unwrapped mode opens the circular arrangement into a series of lines, with the months running horizontally and the years stacked vertically. This makes it easier to compare the same month across different years without the front and back of the spiral overlapping.

![The temperature record unwrapped into rows, with months arranged across each year](/projects/climate-spiral/unwrap_loop.mp4)

The settings let the user adjust the spacing between years, the thickness of the line, and how it is colored. It can be shown as a shaded tube or a simple line. Colors can follow the values, distinguish older and newer years, or show deviations from a reference period. These options change the appearance of the record without changing its measurements.

The controls at the bottom pause or resume the animation and move through individual months. Space toggles playback, Enter switches between Spiral and Unwrapped, and the Home and End keys move to either end of the record.

</ProjectAccordion>

<ProjectAccordion title="Datasets">

The global temperature view uses NASA GISTEMP and begins in 1880. Its values are temperature anomalies relative to the 1951–1980 average, rather than absolute temperatures.

I also included datasets for land and ocean temperature, sea ice, sea level, CO₂, and methane, as well as an option to explore local temperature records. The records cover different periods, so the length of the visualization changes with the selected dataset.

![Atmospheric CO₂ measurements from Mauna Loa displayed as a three-dimensional spiral](/projects/climate-spiral/climate_spiral_co2.mp4)

The different datasets need different units and display scales. A similar radius or color in two views does not mean that their values have the same magnitude or climate effect. CO₂ and methane show concentrations, while sea ice extent and model-estimated ice volume describe different properties of the ice.

The [data sources and methods](https://github.com/BetaNumeric/climate_spiral/blob/main/docs/data-methods.md) document the records, reference periods, and processing in more detail. The program's information panel also explains the currently selected view.

</ProjectAccordion>

<ProjectAccordion title="Exporting">

I added an export function so the visualization can also be used outside the interactive program. The form can be downloaded as a GLB model, or the animation can be recorded as a video directly in the browser.

For video exports, the user can choose the resolution and format, include a legend, and build a camera path from different views. Pauses and transitions make it possible to first watch the record appear from above and then move around it to reveal its three-dimensional structure. The camera path can be previewed before recording.

The [live program](https://betanumeric.github.io/climate_spiral/) can also be opened separately, and the code is available on [GitHub](https://github.com/BetaNumeric/climate_spiral).

</ProjectAccordion>
