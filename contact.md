---
layout: doc
---

<div class="contact-page">

# Get In Touch

Feel free to reach out!

<div class="contact-methods">

<a href="mailto:tim.red@web.de" class="contact-link email-link">
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
  <span>tim.red@web.de</span>
</a>

<div class="social-grid">
 
  <a href="https://linkedin.com/in/timredlich" target="_blank" rel="noreferrer" class="social-card">
    <img src="/assets/icons/linkedin.svg" alt="LinkedIn" class="social-icon" />
    <span>LinkedIn</span>
  </a>
  
  <a href="https://www.youtube.com/user/DerEydeet" target="_blank" rel="noreferrer" class="social-card">
    <img src="/assets/icons/youtube.svg" alt="YouTube" class="social-icon" />
    <span>YouTube</span>
  </a>
  
  <a href="https://instagram.com/eydeet" target="_blank" rel="noreferrer" class="social-card">
    <img src="/assets/icons/instagram.svg" alt="Instagram" class="social-icon" />
    <span>Instagram</span>
  </a>
  
  <a href="https://github.com/BetaNumeric" target="_blank" rel="noreferrer" class="social-card">
    <img src="/assets/icons/github.svg" alt="GitHub" class="social-icon" />
    <span>GitHub</span>
  </a>
  
</div>

</div>

</div>

<style>
.contact-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.contact-page h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  text-align: center;
}

.contact-page > p {
  text-align: center;
  font-size: 1.2rem;
  opacity: 0.8;
  margin-bottom: 4rem;
  line-height: 1.6;
}

.contact-methods {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.contact-methods h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid var(--site-border);
  padding-bottom: 0.5rem;
}

.email-link {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: var(--card-bg);
  border: 1px solid var(--site-border);
  border-radius: 8px;
  font-size: 1.3rem;
  transition: all 0.3s ease;
  text-decoration: none;
  color: var(--site-text);
}

.email-link:hover {
  border-color: var(--site-border-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px var(--card-shadow);
}

.email-link svg {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.social-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1.5rem;
}

.social-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1rem;
  background: var(--card-bg);
  border: 1px solid var(--site-border);
  border-radius: 8px;
  transition: all 0.3s ease;
  text-decoration: none;
  color: var(--site-text);
}

.social-card:hover {
  border-color: var(--site-border-hover);
  transform: translateY(-4px);
  box-shadow: 0 8px 16px var(--card-shadow);
}

.social-card .social-icon {
  width: 48px;
  height: 48px;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.light-mode .social-card .social-icon {
  filter: invert(1);
}

.social-card:hover .social-icon {
  opacity: 1;
}

.social-card span {
  font-size: 1rem;
  font-weight: 500;
}

@media (max-width: 768px) {
  .contact-page h1 {
    font-size: 2rem;
  }
  
  .email-link {
    font-size: 1.1rem;
    padding: 1.2rem 1.5rem;
  }
  
  .social-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
