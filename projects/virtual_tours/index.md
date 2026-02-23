---
layout: project
title: Virtual Tours     
description: "A collection of projects with the goal of creating 360° virtual tours of real locations with a camera"
heroImage: /projects/virtual_tours/1_raw.jpg
heroComponent: LumaHeroEmbed
heroEmbedUrl: "https://www.google.com/maps/embed?pb=!4v1718071352970!6m8!1m7!1sCAoSLEFGMVFpcFBJM0RuQ2NFTEZYZktRTXhMek9UZDM0S0IxTnZMMFljZEFvelhO!2m2!1d53.1022394401417!2d8.850079751220091!3f116.93254020764213!4f-10.164118128441316!5f0.7820865974627469"
heroEmbedTitle: "Virual Tours Hero"
previewMedia: /projects/virtual_tours/fishbowl_whirl.gif
---

<ProjectAccordion :alwaysOpen="true" :centerImages="false">

**DESCRIPTION**
This is a collection of projects with the goal of creating 360° virtual tours of real locations with a camera. Virtual tours give people access to places without being on location and the freedom to choose where they look that photography normally doesn't give. This creates a more complete understanding of the location and how different parts of it are connected.I tried multiple ways to achieve that. One can take a large number of photos all around a point in space and then stitch them to a 360° panorama in software like Photoshop, PTGui, or the Image Composite Editor. This can give you a very high-resolution photo, but it takes a long time and has the potential for many stitching errors. There are tripod heads that make it easier to move the camera with a center point in front of the lens instead of underneath the body, but I don't have one of those. My drone also has a mode to automatically take 34 photos and create a 360° photo, excluding a part of the sky above.A quicker way to take 360° photos is by using an omnidirectional camera like the GoPro Fusion or the Insta360 Camera. These cameras have two extremely wide-angle lenses on opposite sites (>180° each) and take photos simultaneously. You then have to stitch them together in a software like the Insta360 Studio to get an equirectangular photo. To view these photos as an interactive sphere you need a software. They can be uploaded to some websites that support 360° photos, like Google Photos or Facebook, and shared. There are also other sites that host 360° photos and offer to embed their player into your website.Here I've uploaded a 360 photo to Momento360:


<ModelEmbed src="https://momento360.com/e/u/2e745d678bc7462f83553758ae76a8a4?utm_campaign=embed
&utm_source=other
&heading=0
&pitch=0
&field-of-view=75
&size=medium"/>


To create a virtual tour one has to take multiple such photos and connect them. The best-known virtual tour software is probably Google Street View, which is integrated into Google Maps. While most of their tours are made professionally with their Street View cars, they allow you to upload 360° photos and connect them yourself.As an experiment, I mounted a GoPro Fusion on a monopod and took it on a walk. I set it to continuously take photos every few seconds and tried to walk with a constant speed and the camera roughly at the same height above my head.Afterward, I color-corrected the RAW photos and used GoPro's software to stitch the files together and export them as a equirectangular photo. Then I made a batch process in Photoshop to automatically remove myself from the nadir of the photos. To create the tour for Street View I used Panoskin. The GPS location is saved in the metadata of the photos and automatically positions itself on the map. I just had to connect the photos in the right way and upload it to Google Maps. For this one, I also tried connecting not only the closest photos but also the second closest to each photo. That way the user has the option to skip photos and move faster through the tour.


<ModelEmbed src="https://www.google.com/maps/embed?pb=!4v1718055782148!6m8!1m7!1sCAoSLEFGMVFpcE5SQzRFVVJUejNLeTY2MzVkdmVrcFVLU0g1SWJNZVd4WW14WUZ4!2m2!1d21.03078628799329!2d105.844666287303!3f33.27812396998981!4f-4.865190390937386!5f0.7820865974627469"/>


One can also make virtual tours inside buildings. I tried this during some of my exhibitions and combined outside tours with indoor views. For the indoor photos, I put the camera roughly at eye level on a small tripod with a monopod extension to decrease the area that has to be replaced later. I also included 360 photos made by the drone in the tour to provide a better overview of the area.


<ModelEmbed src="https://www.google.com/maps/embed?pb=!4v1718053961515!6m8!1m7!1sCAoSLEFGMVFpcFBRN2dSdUVxLUh0N09nTktKUWlIVVNPM2QteTU4bDFGSGJRcy1Q!2m2!1d52.84379617682896!2d9.226208408576616!3f60.493508924395705!4f-30.916171996874326!5f0.7820865974627469"/>


Another way of making virtual tours is to make a 3D model that one can move through. One can use Photogrammetry for that, another way is to use Lidar to accurately scan a room. With apps like Polycam, you can use a smartphone's lidar sensor to scan a room and create a floor plan and a 3D model of the room.
It is also possible to combine 360° photo tours and 3D models. When moving from one to the next photo sphere one can get a 3D transition effect while loading the next photo. Google Streetview kind of fakes this by zooming into the direction of motion. But other platforms create a 3D environment from the 360° photos for the transitions and make a "dollhouse" view of all the rooms. The most popular is probably Matterport. However, it is very expensive and requires a monthly fee.


![metareal](/projects/virtual_tours/metareal.jpg)


An alternative I found is Metareal. They allow you to make one free tour, but you have to help the program create the 3D model from the pictures by drawing guidelines around the dominant shapes in the room. You can switch between the virtual tour, the 3D "dollhouse" model, and a 2D floorplan. It also allows you to add annotations and labels inside the virtual tour.


<ModelEmbed src="https://tour-de.metareal.com/apps/player?asset=13a97c7c-3f51-4bb1-bce4-ea92205394d9
&starting=tour
&autostart=true
&labels=1"/>


For the DIGIHUB's virtual tour on Google Maps, I used the Insta360 X4 omnidirectional camera. Because of the big difference in brightness between the rooms and the window view outside, I took an HDR and a RAW photo of each point. The HDR photo has a higher dynamic range, but the RAW photo has a better quality so I could use the RAW file for most scenes and fill in the bright parts with the HDR when needed. I triggered the camera remotely with my phone so I wouldn't shake the camera and also to not capture myself. I placed the camera paying attention so that it wouldn't see itself in a reflection of the many windows.

![raw](/projects/virtual_tours/1_raw.jpg)

The Insta360 workflow is a bit different from the GoPro Fusion’s. The RAW file has to be stitched in Insta360 Studio before it can be exported as a RAW equirectangular file and be developed in other programs.


![stitched](/projects/virtual_tours/2_stitched.jpg)


This caused a few problems because Adobe Camera Raw isn't optimized to edit 360° photos. I can develop the equirectangular RAW files, but once I'm done and view it in a 360° software a slight vertical seam can appear where the left and right ends of the image connect. This is because, for some effects like shadows or highlights, Camera RAW takes averages of areas on the photo. But the software treads it like a regular photo and doesn't wrap around on the left or right side. Therefore it can arrive at different values and end up making one side brighter or darker than the other.

It is possible to "trick" Photoshop into considering the other side by extending each side before applying effects and cropping it back to normal afterward. However, it can't do that with RAW files, so a lot of information would be lost. I ended up making an action for a batch process that tried to fix the seam after it occurred.
This action duplicates the image and moves it so the sides touch in the middle of the canvas. It adds one row of pixels to each side, by duplicating the ones next to it so that the images are overlapping each other by two pixels. Then I apply the Auto-Blend function with Seamless Tones and Colors enabled. This removes the seam.


![seamless](/projects/virtual_tours/3_seamless.jpg)

The next step was to remove the tripod on all photos with another batch process removing a circle around the nadir. Then I combined the Developed RAW files that had overexposed areas with the HDR to get some of the highlights back. For this, I also used an action to semi-automate the process but drew the areas manually.

Then I removed all the people in the background that I captured by accident with a clone stamp brush and content aware fill. I also removed the license plates from cars in a similar way. I finally added a few details like signs and posters, that I took close-up photos of and combined them with the 360° photo.

![cleanup](/projects/virtual_tours/4_cleanup.jpg)

Then I uploaded the photos to TourBuilder (Panoskin). I organized them into different levels and then started connecting and aligning them with each other. I organized the photos in different levels to switch between them later. 

![panoskin](/projects/virtual_tours/5_panoskin.jpg)

Once the images are connected it uploads and publishes them with all the settings to Google Maps. Once it has been processed by Google, the tour is visible and can be found:


<ModelEmbed src="https://www.google.com/maps/embed?pb=!4v1718074306795!6m8!1m7!1sCAoSLEFGMVFpcFBHdVZ1emJVdy1mWTNzQzV2S1lRN3hENURIcmNiSVZxb3Vkd0wx!2m2!1d53.10162029743275!2d8.851158918656425!3f58.97727815426235!4f-25.055891957759385!5f0.7820865974627469"/>

</ProjectAccordion>

