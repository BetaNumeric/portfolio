---
layout: doc
---

<ClientOnly>
  <AboutScene />
</ClientOnly>

<div class="about-container">
  <div id="3d-target" class="model-target"></div>
  
  <div class="about-content">
    
# I'm Tim

I am a digital media artist and creative technologist exploring the intersection of art, science, and technology.

My work combines engineering, programming, and interactive design to create installations and experiences that challenge perceptions and reveal the unseen dynamics of our world.

  </div>
</div>

<style>
.about-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 4rem;
  margin-top: 4rem;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.model-target {
  width: 400px;
  height: 600px;
  flex-shrink: 0;
  /* Visual guide for debugging if needed, currently transparent */
}

.about-content {
  flex: 1;
  max-width: 500px;
  position: relative;
  z-index: 0; /* Changed from 10 to 0 to let particles (z-index 1) fly over */
  pointer-events: auto;
}

/* Typography Overrides for this Page */
.about-content h1 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  border: none;
  padding: 0;
}

.about-content p {
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.8;
  margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
  .about-container {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
  }
  
  .model-target {
    width: 300px;
    height: 400px; 
    order: -1; /* Model on top */
  }

  .about-content {
    padding: 0 1rem;
  }
}
</style>
