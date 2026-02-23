---
layout: project
title: 3D Project Scans 
description: "A collection of experiments with ways of turning photos into 3D models"
heroImage: /projects/3d_photo_scan/tractor_scan_3.jpg
heroComponent: LumaHeroEmbed
heroEmbedUrl: "https://lumalabs.ai/embed/2009c83d-0015-419c-8ee2-580755f92704?mode=sparkles&background=%23181818&color=%23FFFFFF&showTitle=false&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&showMenu=false"
heroEmbedTitle: "3D Photo Scans Hero"
previewMedia: /projects/3d_photo_scan/3d.gif
---

<ProjectAccordion :alwaysOpen="true" :centerImages="false">

**DESCRIPTION**

This is a collection of experiments with ways of turning photos into 3D models. I like photography because it is a way to preserve and share a slice of time that could otherwise get lost. However usually a photograph is just a flat, 2D representation of the 3D world and a whole dimension gets lost in the process.I wanted to preserve objects from the real world and bring them into a virtual one, where they can be cloned, manipulated and used in many ways.To achive that I tried a few programs and apps: There is the Open-Source photogrammetry software called [Meshroom](https://alicevision.org/#meshroom) , an app called [Polycam](https://poly.cam/), which is free to use, but one needs to pay a premium subscription to export the 3D models. There is [Luma Labs](https://lumalabs.ai/), they focus on NeRF (Neural Radiance Fields). And I got the best best results from [RealityCapture](https://www.capturingreality.com/realitycapture), which runs locally and lets you create 3D meshes for free, but requires a licencing fee for downloading the finished 3D model based on how many photos and pixels were used.I've uploaded some of my scanned 3D objects to [Sketchfab](https://sketchfab.com/eydeet) , like this apple I made:


<ModelEmbed src="https://sketchfab.com/models/790093f476a04e49a6873e820bca04c5/embed?autospin=0.4&autostart=0&ui_hint=0" />


To make a scanned model I take photos of it from many different angles. For this red tractor, I took 275 photos. I try to get soft lighting, in this case, I took the photos on an overcast day, to prevent hard shadows from getting baked into the texture. I then edit the RAW files and export them as relatively flat photos to get the most details from the highlights and shadows. Next, I run the files through a batch process in Photoshop, that automatically selects the subject, removes the background, and trims the edges of the photos to decrease the amounts of pixels. This makes it easier for the algorithm because it won't get distracted by the background and it also lowers the licensing cost in RealityCapture.


![tractor scan](/projects/3d_photo_scan/tractor_scan_1.jpg)

I import the cut-out and trimmed photos with alpha channels into the program and let it align them. The algorithm detects similar points on the images and with triangulation, it measures the relative locations of the camera and the points on the photos. With this data, it creates a point cloud, colored by the pixels corresponding to the photos. Then I crop parts that I don't need (although with the background removal, I rarely have to do this step) and let it create a mesh from the point cloud. Then I unwrap and texture the model. In this case, I got a model with almost 63 million triangles, so after that, I simplify the model to reduce the number of triangles and reproject the texture from the high-poly model. I also make a normal reprojection to keep the details stored in a texture.

![tractor scan](/projects/3d_photo_scan/tractor_scan_2.jpg)

When I'm satisfied with the results I license and export the model and import it in Blender, where I can clean up some loose geometry and texture issues. I also scale it and reposition it here, before exporting it again. Then I uploaded it to Sketchfab, where I can add dynamic lights and shadows to it and share the model with others.


<ModelEmbed src="https://sketchfab.com/models/0f405af210f044d7aca9c72bc0816d88/embed?transparent=0&autospin=0.4&autostart=0&ui_hint=0" />


I also used my drone to make photo scans of larger objects. For this scan of the Lichtenstein Castle in the Swabian Jura of southern Germany, I used drone footage from multiple different angles and extracted the frames from the video afterward. I filmed it on an overcast day in winter so there were no harsh shadows and the trees had no leaves.


<ModelEmbed src="https://sketchfab.com/models/9ebec3a32fdd48529e4962582a848e9a/embed?autospin=0.4&autostart=0&ui_hint=0" />


For scans of larger objects like this farm in Wisconsin, I program a path for the drone to fly and automatically take photos along the way. That way I don't forget to photograph areas and can easily return to where I left off after changing the battery.


<ModelEmbed src="https://sketchfab.com/models/278d05b1efa840a5a4b53e71813a5410/embed?autospin=0.4&autostart=0&ui_hint=0" />


I can also use this method to extract detailed elevation maps from a landscape. I used this for aerial archaeology on a field in Germany. The slight variations in soil depth can be remnants of ancient settlements or tombs. The crops also change color slightly differently based on soil depth, which can be enhanced in the images with an algorithm for monitoring plant health. These drone scans have been used to help get an archaeological excavation approved.

![excavation scan](/projects/3d_photo_scan/excavation_scan.jpg)

To scan smaller objects like small stones or food items I partially automated the photography process. I built a small "photo studio" inside a softbox to get a controlled lighting setup with very soft, diffuse light and to minimize reflections of the room in the objects. Inside the softbox, I put a tripod mount that slowly and steadily rotates 360° around its axis, on which I place the object that I want to scan. To make it easier to remove the tripod mount later on I usually put a white piece of paper or cloth between the object and the mount, or I put it on a small glass for separation. I set my camera to take a set of pictures with a few seconds delay and program the mount to rotate once 360° within the time the camera needed to finish the set. After each set, I move the object or camera a bit and make another rotation until I have covered all angles. Sometimes the program generates multiple separate point clouds. I then either have to take more photos or manually place control points on photos of each set, to combine the components into one unified point cloud before generating the mesh.

![pineapple scan](/projects/3d_photo_scan/pineapple_scan_1.jpg)

Some objects are better suited for photogrammetry than others. For example, the pineapple's leaves are fairly thin and can deform, so I had to be careful when moving the fruit to not change the leaves between photos. They are still relatively rigid and thick enough, for example, other plants with thinner leaves can be harder to capture with this method because they move too much between photos or are so thin that the program can't make a 3D mesh out of them.


<ModelEmbed src="https://sketchfab.com/models/c0ae17df4b1b40809896063dee87df57/embed?autospin=0.4&autostart=0&ui_hint=0" />


For even smaller objects like small stones, seashells, or this walnut I'm using a 70mm macro lens and a narrow aperture to ensure the whole object stays in focus. I also decrease the rotation speed of the 360° mount, to avoid motion blur.


<ModelEmbed src="https://sketchfab.com/models/12e013d6d23046c39b55396297cd7b52/embed?autospin=0.4&autostart=0&ui_hint=0" />

Sketchfab also allows you to upload and animate multiple 3D objects by adding a file containing the order and the duration of each frame. Here, I took ten photo scans of an apple and took a bite out of it between each scan to create a 3D stop-motion animation.

<ModelEmbed src="https://sketchfab.com/models/a3e40e1540ed41fc95a9d6278b06c06b/embed?autospin=0.4&autostart=0&ui_hint=0" />


Reflective or transparent surfaces are challenging properties for photogrammetry. For example, a glass of water or a shiny car will make it hard for the program to analyze, because their reflections and refractions changes depending on the angle from which it is photographed. It will set both matching points for the object and the reflection within the object and will end up with an uneven mesh.
Reflections can also end up getting baked into the texture. It can also be problematic if the object is too smooth and has large areas with only one color and no texture or a perfectly repeating texture.I worked around that problem with this Amethyst Crystal, by photogrphing it carefully to avoid direct reflections. It was also a bit dusty, which made it easier for the program to detect texture. I later turned it into a very low poly model, which fit well with the way the large crystals looked. And I used the normal texture to paint back in some more detail for the rougher back side.


<ModelEmbed src="https://sketchfab.com/models/887b1d2cd4cc4aceb6fcab8b5a017bd8/embed?autospin=0.4&autostart=0&ui_hint=0" />


One can also use a polarization filter to get rid of reflections on shiny surfaces and even extract the roughness information from the photos. Both the light source and the lens need a polarization filter so that both parallel- and cross-polarized images of the object can be taken. Then the images need to be subtracted from each other and after a textured mesh from the cross-polarized images has been made a second texture from the black and white subtracted photos can be made and used for the "roughness" or "glossiness" of the 3D model.NeRFs (Neural radiance field) can get red of some of these problems. It is a method of recreating a 3D environment from photos based on deep learning. The model learns not only the 3D geometry but also the reflectance properties of the scenes. So scenes with reflective surfaces like cars, lakes, or windows and translucent properties, like crystals, water, or glass, and even very fuzzy things like fluffy pillows, plants, and trees can be captured and displayed from novel angles. However you don't get a simple mesh for one object, but rather a complete model trained for the whole scene. It could be good for compositing or creating unique camera paths for videos. It is also supported in Unreal Engine 5. I used LumaLabs for my NeRFs.


<ModelEmbed src="https://lumalabs.ai/embed/ec6035d5-cf26-49b8-b7db-0bb66e47f95e?mode=video&background=%23181818&color=%23FFFFFF&showTitle=false&loadBg=true&logoPosition=bottom-left&infoPosition=bottom-right&cinematicVideo=https%3A%2F%2Fcdn-luma.com%2Frenders%2F5f502452c940f3819fb714804700eff090566e25736482c6e54b6b502987ef75%2FTractor_video.mp4&showMenu=true" />

</ProjectAccordion>

