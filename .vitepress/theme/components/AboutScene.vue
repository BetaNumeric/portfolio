<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// --- CONFIGURATION ---
const MODEL_URL = withBase('/model/me.glb')
const DESKTOP_PARTICLE_COUNT = 100000
const MOBILE_PARTICLE_COUNT = 60000
const REDUCED_MOTION_PARTICLE_COUNT = 30000
const POINT_DENSITY_REFERENCE = 1000000
const MAX_POINT_SIZE_SCALE = 5

// --- SHADERS ---
const vertexShader = `
    uniform float uPixelRatio;
    uniform float uPointScale;
    uniform vec3 uMouse;
    attribute float aPointSize;
    varying vec2 vUv;
    void main() {
        vUv = uv; 
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        // Keep most particles near the middle of the range, with occasional
        // smaller and larger points for a less uniform surface.
        float sizeVariation = mix(0.6, 1.6, pow(aPointSize, 1.7));
        float size = 2.5 * sizeVariation;
        gl_PointSize = (size * uPixelRatio * uPointScale) / -mvPosition.z;
    }
`

const fragmentShader = `
    uniform sampler2D uTexture; 
    uniform bool uUseTexture;   
    varying vec2 vUv;
    void main() {
        if (distance(gl_PointCoord, vec2(0.5, 0.5)) > 0.5) discard;
        vec3 finalColor;
        if (uUseTexture) {
            vec4 texColor = texture2D(uTexture, vUv);
            finalColor = texColor.rgb * 1.2;
        } else {
            finalColor = vec3(0.0, 1.0, 1.0);
        }
        gl_FragColor = vec4(finalColor, 1.0);
    }
`

const containerRef = ref<HTMLElement | null>(null)
const loaderRef = ref<HTMLElement | null>(null)
const loadError = ref(false)
let animationId: number | null = null
let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera

onMounted(() => {
    if (!containerRef.value) return

    const container = containerRef.value
    const loaderElement = loaderRef.value
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const particleCount = prefersReducedMotion
        ? REDUCED_MOTION_PARTICLE_COUNT
        : isMobile
          ? MOBILE_PARTICLE_COUNT
          : DESKTOP_PARTICLE_COUNT
    const maxPixelRatio = isMobile ? 1.5 : 2
    let disposed = false

    scene = new THREE.Scene()
    scene.background = null

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 3.5)

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // --- INTERACTION STATE ---
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-100, -100)
    const dummyPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100),
        new THREE.MeshBasicMaterial({ visible: false })
    )
    scene.add(dummyPlane)

    const mouse3D = new THREE.Vector3(0, 0, 0)
    const prevMouse3D = new THREE.Vector3(0, 0, 0)
    const mouseVelocity = new THREE.Vector3(0, 0, 0)
    
    let isDragging = false
    let isInteracting = false
    let pulseIntensity = 0
    let swirlDirection = 1.0
    
    // Rotation Variables
    let rotationSpeed = 0
    let dragVelocityX = 0
    const MAX_ROTATION_SPEED = 0.002
    let lastInteractionTime = Date.now()
    let previousTouchX = 0

    const customUniforms = {
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, maxPixelRatio) },
        uPointScale: {
            value: Math.min(MAX_POINT_SIZE_SCALE, Math.sqrt(POINT_DENSITY_REFERENCE / particleCount))
        },
        uTexture: { value: null as THREE.Texture | null },
        uUseTexture: { value: false }
    }

    const updatePointScale = (visibleCount: number) => {
        const safeCount = Math.max(visibleCount, 1)
        customUniforms.uPointScale.value = Math.min(
            MAX_POINT_SIZE_SCALE,
            Math.max(1, Math.sqrt(POINT_DENSITY_REFERENCE / safeCount))
        )
    }

    // --- PHYSICS DATA & OPTIMIZATION ---
    let particles: THREE.Points | null = null
    let originalPositions: Float32Array, currentPositions: Float32Array, velocities: Float32Array, particleRandoms: Float32Array
    
    let bufferCount = 0 // Total capacity
    let activeParticleCount = 0 // Currently rendered count
    let modelHeight = 1.0
    
    // Performance Tracking
    let lastFpsCheck = 0
    let frameCount = 0
    let lowFpsStreak = 0
    let highFpsStreak = 0
    let scrollRaf = 0
    let pausePhysicsUntil = 0
    const SCROLL_PHYSICS_PAUSE_MS = 140

    const updateModelPosition = () => {
        const targetEl = document.getElementById('3d-target')
        
        // Handle loader positioning
        if (loaderElement && !loaderElement.classList.contains('hidden')) {
             if (targetEl) {
                const rect = targetEl.getBoundingClientRect()
                const cx = rect.left + rect.width / 2
                const cy = rect.top + rect.height / 2
                loaderElement.style.left = cx + 'px'
                loaderElement.style.top = cy + 'px'
             } else {
                loaderElement.style.left = '50%'
                loaderElement.style.top = '50%'
             }
        }

        if (!particles || !targetEl) {
             if (particles && !targetEl) {
                 // Fallback if no target found
                 particles.position.set(0, 0, 0)
             }
             return
        }

        // Project the target element's 2D screen position into 3D space
        const rect = targetEl.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        
        // Convert screen (pixels) to Normalized Device Coordinates (NDC) [-1, 1]
        // Three.js: (0,0) is center. Screen: (0,0) is top-left.
        const ndcX = (cx / window.innerWidth) * 2 - 1
        const ndcY = -(cy / window.innerHeight) * 2 + 1
        
        // Unproject depth. 0.5 is arbitrary, we just want a direction vector.
        const vector = new THREE.Vector3(ndcX, ndcY, 0.5)
        vector.unproject(camera)
        
        // Calculate the position where the ray intersects the plane at Z=0 (or wherever the model should be depth-wise)
        // Camera is at z=3.5. Model should be at z=0?
        // Original script: distance = -camera.position.z / dir.z => t so that P = O + t*D has z=0
        const dir = vector.sub(camera.position).normalize()
        const distance = -camera.position.z / dir.z
        const pos = camera.position.clone().add(dir.multiplyScalar(distance))
        
        particles.position.copy(pos)

        // Scale Logic
        const vFOV = THREE.MathUtils.degToRad(camera.fov)
        const visibleHeightAtZ0 = 2 * Math.tan(vFOV / 2) * camera.position.z
        const screenPct = rect.height / window.innerHeight
        const desiredHeight3D = visibleHeightAtZ0 * screenPct
        
        if (modelHeight > 0 && rect.height > 0) {
            const scale = desiredHeight3D / modelHeight
            particles.scale.setScalar(scale)
        }
    }

    // --- HELPER: Geometry Sampling ---
    function sampleGeometry(geometry: THREE.BufferGeometry, count: number) {
        const positions = new Float32Array(count * 3)
        const uvs = new Float32Array(count * 2)
        const posAttr = geometry.attributes.position
        const uvAttr = geometry.attributes.uv
        const indexAttr = geometry.index
        
        const getPos = (i: number, target: THREE.Vector3) => {
            const idx = indexAttr ? indexAttr.getX(i) : i
            target.fromBufferAttribute(posAttr as THREE.BufferAttribute, idx)
        }
        const getUv = (i: number, target: THREE.Vector2) => {
            if (!uvAttr) return target.set(0,0)
            const idx = indexAttr ? indexAttr.getX(i) : i
            target.fromBufferAttribute(uvAttr as THREE.BufferAttribute, idx)
        }

        const faceCount = (indexAttr ? indexAttr.count : posAttr.count) / 3
        const areas: number[] = []
        let totalArea = 0
        const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()

        for (let i = 0; i < faceCount; i++) {
            getPos(i * 3, a); getPos(i * 3 + 1, b); getPos(i * 3 + 2, c);
            const area = 0.5 * new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(b, a), new THREE.Vector3().subVectors(c, a)).length()
            areas.push(area)
            totalArea += area
        }

        let generated = 0
        let cumulative = 0
        const uvA = new THREE.Vector2(), uvB = new THREE.Vector2(), uvC = new THREE.Vector2()

        for (let i = 0; i < faceCount; i++) {
            cumulative += areas[i]
            const target = Math.floor((cumulative / totalArea) * count)
            const n = target - generated
            if (n <= 0) continue

            getPos(i * 3, a); getPos(i * 3 + 1, b); getPos(i * 3 + 2, c);
            getUv(i * 3, uvA); getUv(i * 3 + 1, uvB); getUv(i * 3 + 2, uvC);

            for (let j = 0; j < n; j++) {
                const r1 = Math.random(), r2 = Math.random()
                const sqrtR1 = Math.sqrt(r1)
                const u = 1 - sqrtR1, v = sqrtR1 * (1 - r2), w = sqrtR1 * r2

                positions[generated*3] = a.x*u + b.x*v + c.x*w
                positions[generated*3+1] = a.y*u + b.y*v + c.y*w
                positions[generated*3+2] = a.z*u + b.z*v + c.z*w
                
                uvs[generated*2] = uvA.x*u + uvB.x*v + uvC.x*w
                uvs[generated*2+1] = uvA.y*u + uvB.y*v + uvC.y*w
                generated++
            }
        }
        return { positions, uvs }
    }

    function shuffleIndices(count: number) {
        const indices = new Uint32Array(count)
        for (let i = 0; i < count; i++) indices[i] = i
        for (let i = count - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]]
        }
        return indices
    }

    // --- LOADING ---
    const gltfLoader = new GLTFLoader()
    gltfLoader.load(MODEL_URL, (gltf) => {
        if (disposed) return
        const model = gltf.scene
        let texture: THREE.Texture | null = null
        
        model.updateMatrixWorld(true)
        model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh && !particles) {
                const mesh = child as THREE.Mesh
                const tempGeo = mesh.geometry.clone()
                tempGeo.applyMatrix4(mesh.matrixWorld)
                
                // Center Geometry & Compute Height for Scaling
                tempGeo.computeBoundingBox()
                const bbox = tempGeo.boundingBox!
                modelHeight = bbox.max.y - bbox.min.y
                
                const center = new THREE.Vector3()
                bbox.getCenter(center)
                tempGeo.translate(-center.x, -center.y, -center.z)
                
                if ((mesh.material as THREE.MeshStandardMaterial).map) {
                     texture = (mesh.material as THREE.MeshStandardMaterial).map
                }
                
                const sampled = sampleGeometry(tempGeo, particleCount)
                const indices = shuffleIndices(particleCount)
                const pos = new Float32Array(particleCount * 3)
                const uv = new Float32Array(particleCount * 2)

                for(let i=0; i<particleCount; i++) {
                    const src = indices[i]
                    pos[i*3] = sampled.positions[src*3]
                    pos[i*3+1] = sampled.positions[src*3+1]
                    pos[i*3+2] = sampled.positions[src*3+2]
                    uv[i*2] = sampled.uvs[src*2]
                    uv[i*2+1] = sampled.uvs[src*2+1]
                }

                const geo = new THREE.BufferGeometry()
                geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
                geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
                
                bufferCount = particleCount
                activeParticleCount = particleCount
                originalPositions = new Float32Array(pos)
                currentPositions = (geo.attributes.position as THREE.BufferAttribute).array as Float32Array
                velocities = new Float32Array(bufferCount * 3)
                particleRandoms = new Float32Array(bufferCount)
                const pointSizeRandoms = new Float32Array(bufferCount)
                for(let i=0; i<bufferCount; i++) {
                    particleRandoms[i] = Math.random()
                    pointSizeRandoms[i] = Math.random()
                }
                geo.setAttribute('aPointSize', new THREE.BufferAttribute(pointSizeRandoms, 1))

                if (texture) {
                    customUniforms.uTexture.value = texture
                    customUniforms.uUseTexture.value = true
                }

                const mat = new THREE.ShaderMaterial({
                    uniforms: customUniforms,
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    transparent: false, depthWrite: true, blending: THREE.NormalBlending
                })

                particles = new THREE.Points(geo, mat)
                particles.frustumCulled = false
                tempGeo.dispose()

                scene.add(particles)
                if (loaderElement) loaderElement.classList.add('hidden')

                lastFpsCheck = performance.now()
                updateModelPosition()
                if (prefersReducedMotion) renderer.render(scene, camera)
            }
        })
    }, undefined, () => {
        if (disposed) return
        loadError.value = true
    })

    // --- INPUT HANDLING ---
    
    function updateMouse(x: number, y: number) {
        mouse.x = (x / window.innerWidth) * 2 - 1
        mouse.y = -(y / window.innerHeight) * 2 + 1
    }
    
    function interact() {
        lastInteractionTime = Date.now()
    }
    
    function canStartInteraction(target: EventTarget | null) {
        if (!(target instanceof Element)) return false
        const region = target.closest('.about-container')
        const control = target.closest('a, button, input, textarea, select, [role="button"]')
        return Boolean(region && !control)
    }

    const onMouseMove = (e: MouseEvent) => { 
        updateMouse(e.clientX, e.clientY)
        if (isDragging) {
            dragVelocityX = e.movementX * 0.005
            interact()
        }
    }
    
    const onMouseDown = (e: MouseEvent) => { 
        if (e.button !== 0 || !canStartInteraction(e.target)) return
        isDragging = true
        dragVelocityX = 0
        pulseIntensity = 0.8
        swirlDirection = 1.0
        interact()
    }

    const onMouseUp = () => { isDragging = false }
    
    const onTouchStart = (e: TouchEvent) => {
        if (!canStartInteraction(e.target)) return
        if(e.touches.length > 0) {
            const tx = e.touches[0].clientX
            const ty = e.touches[0].clientY
            updateMouse(tx, ty)
            previousTouchX = tx
            isDragging = true
            pulseIntensity = 0.8
            dragVelocityX = 0
            swirlDirection = 1.0
            interact()
            
            dummyPlane.lookAt(camera.position)
            raycaster.setFromCamera(mouse, camera)
            const hits = raycaster.intersectObject(dummyPlane)
            if(hits.length>0) {
                prevMouse3D.copy(hits[0].point)
                mouse3D.copy(hits[0].point)
                if (particles) mouse3D.sub(particles.position)
                if (particles) mouse3D.applyQuaternion(particles.quaternion.clone().invert())
                customUniforms.uMouse.value.copy(mouse3D)
            }
        }
    }
    
    const onTouchEnd = () => { isDragging = false }
    
    const onTouchMove = (e: TouchEvent) => { 
        if(e.touches.length > 0) {
            const tx = e.touches[0].clientX
            const ty = e.touches[0].clientY
            updateMouse(tx, ty)
            const deltaX = tx - previousTouchX
            dragVelocityX = deltaX * 0.005
            previousTouchX = tx
        }
    }

    if (!prefersReducedMotion) {
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mouseup', onMouseUp)
        window.addEventListener('touchstart', onTouchStart, { passive: true })
        window.addEventListener('touchend', onTouchEnd)
        window.addEventListener('touchmove', onTouchMove, { passive: true })
    }

    // --- ANIMATION LOOP ---
    const zoomScale = 3.5 / 3.0 

    const onScroll = () => {
        // Keep positioning responsive during scroll by prioritizing anchor sync.
        pausePhysicsUntil = performance.now() + SCROLL_PHYSICS_PAUSE_MS
        if (scrollRaf) return
        scrollRaf = window.requestAnimationFrame(() => {
            scrollRaf = 0
            updateModelPosition()
            renderer.render(scene, camera)
        })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    function animate() {
        animationId = null
        if (document.hidden) return
        updateModelPosition()
        const nowTime = performance.now()
        const shouldRunPhysics = nowTime >= pausePhysicsUntil

        // --- FAST ADAPTIVE OPTIMIZER ---
        const currentTime = nowTime
        frameCount++
        const timeDiff = currentTime - lastFpsCheck
        
        if (timeDiff >= 500) { 
            const fps = (frameCount / timeDiff) * 1000
            frameCount = 0
            lastFpsCheck = currentTime
            
            if (fps < 25) {
                lowFpsStreak++
                highFpsStreak = 0
                if (lowFpsStreak >= 2 && activeParticleCount > 10000 && particles) {
                    const newCount = Math.floor(activeParticleCount * 0.8)
                    activeParticleCount = newCount
                    particles.geometry.setDrawRange(0, activeParticleCount)
                    updatePointScale(activeParticleCount)
                    lowFpsStreak = 0 
                }
            } 
            else if (fps > 35) {
                highFpsStreak++
                lowFpsStreak = 0
                if (highFpsStreak >= 4 && activeParticleCount < bufferCount && particles) {
                    const prevCount = activeParticleCount
                    const newCount = Math.min(bufferCount, Math.floor(activeParticleCount * 1.1))
                    activeParticleCount = newCount
                    particles.geometry.setDrawRange(0, activeParticleCount)
                    updatePointScale(activeParticleCount)
                    
                    // FIX: Reset newly awakened particles so they don't glitch/jump
                    for (let i = prevCount; i < newCount; i++) {
                        const ix = i * 3
                        const iy = i * 3 + 1
                        const iz = i * 3 + 2
                        
                        currentPositions[ix] = originalPositions[ix]
                        currentPositions[iy] = originalPositions[iy]
                        currentPositions[iz] = originalPositions[iz]
                        
                        velocities[ix] = 0
                        velocities[iy] = 0
                        velocities[iz] = 0
                    }
                    
                    highFpsStreak = 0
                }
            } else {
                lowFpsStreak = 0
                highFpsStreak = 0
            }
        }

        if (isDragging) {
            rotationSpeed = dragVelocityX
        } else {
            if (Date.now() - lastInteractionTime > 3000) {
                if (rotationSpeed < MAX_ROTATION_SPEED) rotationSpeed += 0.0001
            } else {
                rotationSpeed *= 0.95
            }
        }
        
        if (particles) {
            if (Math.abs(rotationSpeed) > 0.00001) {
                particles.rotation.y += rotationSpeed
            }
        }

        if (pulseIntensity > 0) {
            pulseIntensity *= 0.92
            if (pulseIntensity < 0.01) pulseIntensity = 0
        }

        dummyPlane.lookAt(camera.position)
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObject(dummyPlane)

        if (intersects.length > 0) {
            const point = intersects[0].point
            
            mouseVelocity.copy(point).sub(prevMouse3D)
            prevMouse3D.copy(point)
            mouse3D.copy(point)
            
            if (particles) {
                mouse3D.sub(particles.position)
                mouse3D.applyQuaternion(particles.quaternion.clone().invert())
                mouse3D.divide(particles.scale)
                
                mouseVelocity.applyQuaternion(particles.quaternion.clone().invert())
                mouseVelocity.divide(particles.scale)
            }
            
            customUniforms.uMouse.value.copy(mouse3D)
        } else {
            mouseVelocity.set(0,0,0)
        }

        const mouseSpeed = mouseVelocity.length()
        const isMoving = mouseSpeed > 0.02
        isInteracting = isDragging || isMoving || pulseIntensity > 0

        let targetRadius = 0.01
        if (isDragging) targetRadius = Math.max(mouseSpeed * 4.0, 0.3 * zoomScale)
        else if (isMoving) targetRadius = Math.max(mouseSpeed * 4.0, 0.1 * zoomScale)
        
        if (pulseIntensity > 0) targetRadius = Math.max(targetRadius, pulseIntensity)
        targetRadius = Math.min(targetRadius, 0.8)

        const interactionRadius = isInteracting ? targetRadius : 0.01
        const interactionRadiusSq = interactionRadius * interactionRadius

        if (particles && originalPositions && shouldRunPhysics) {
            const phaseNow = Date.now() * 0.006
            const localViewAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(particles.quaternion.clone().invert()).normalize()
            
            for (let i = 0; i < activeParticleCount; i++) {
                const ix = i * 3; const iy = i * 3 + 1; const iz = i * 3 + 2
                let px = currentPositions[ix]
                let py = currentPositions[iy]
                let pz = currentPositions[iz]
                
                let vx = velocities[ix]; let vy = velocities[iy]; let vz = velocities[iz]
                const r = particleRandoms[i]

                // Calculate distance vector
                const ox = originalPositions[ix]
                const oy = originalPositions[iy]
                const oz = originalPositions[iz]
                
                const dx = ox - px
                const dy = oy - py
                const dz = oz - pz
                
                const distSq = dx*dx + dy*dy + dz*dz

                // --- 1. SPRING PHYSICS (Smooth Exponential Snap) ---
                const baseK = 0.001 * (0.5 + r)
                const sharpness = 5.0
                const snapForce = 0.05 
                const proximity = 1.0 / (1.0 + distSq * sharpness)
                const springK = baseK + snapForce * (proximity * proximity * proximity)
                
                vx += dx * springK
                vy += dy * springK
                vz += dz * springK

                // --- 2. INTERACTION ---
                const mDx = px - mouse3D.x
                const mDy = py - mouse3D.y
                const mDz = pz - mouse3D.z
                const mDistSq = mDx*mDx + mDy*mDy + mDz*mDz

                if (mDistSq < interactionRadiusSq) {
                    const dist = Math.sqrt(mDistSq)
                    const influence = (1.0 - (mDistSq / interactionRadiusSq))
                    
                    if (isInteracting) {
                        const force = (0.8 + r * 0.4)
                        vx += mouseVelocity.x * force * influence * 0.2
                        vy += mouseVelocity.y * force * influence * 0.2
                        vz += mouseVelocity.z * force * influence * 0.2

                        if (dist > 0.001) {
                            // Rotation-Independent Swirl
                            const swirl = 0.15 * (0.5 + r) * swirlDirection
                            
                            const sx = localViewAxis.y * mDz - localViewAxis.z * mDy
                            const sy = localViewAxis.z * mDx - localViewAxis.x * mDz
                            const sz = localViewAxis.x * mDy - localViewAxis.y * mDx
                            
                            vx += sx * swirl * influence
                            vy += sy * swirl * influence
                            vz += sz * swirl * influence
                            
                            const pulse = Math.sin(phaseNow + r * 6.28)
                            const rad = 0.05 * pulse * force
                            vx += (mDx / dist) * rad * influence
                            vy += (mDy / dist) * rad * influence
                            vz += (mDz / dist) * rad * influence
                        }
                        
                        if (pulseIntensity > 0) {
                            const pForce = pulseIntensity * 0.05
                            vx += (mDx / dist) * pForce * influence
                            vy += (mDy / dist) * pForce * influence
                            vz += (mDz / dist) * pForce * influence
                        }
                    }
                }

                vx *= 0.90; vy *= 0.90; vz *= 0.90
                px += vx; py += vy; pz += vz
                
                currentPositions[ix] = px; currentPositions[iy] = py; currentPositions[iz] = pz
                velocities[ix] = vx; velocities[iy] = vy; velocities[iz] = vz
            }
            particles.geometry.attributes.position.needsUpdate = true
            // updateRange is not needed in recent Three.js versions
        }

        renderer.render(scene, camera)
        if (!prefersReducedMotion) {
            animationId = requestAnimationFrame(animate)
        }
    }

    if (prefersReducedMotion) {
        animate()
    } else {
        animationId = requestAnimationFrame(animate)
    }

    const onVisibilityChange = () => {
        if (document.hidden) {
            if (animationId !== null) cancelAnimationFrame(animationId)
            animationId = null
        } else if (!prefersReducedMotion && animationId === null) {
            animationId = requestAnimationFrame(animate)
        }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        const pixelRatio = Math.min(window.devicePixelRatio || 1, maxPixelRatio)
        renderer.setPixelRatio(pixelRatio)
        customUniforms.uPixelRatio.value = pixelRatio
        updateModelPosition()
        renderer.render(scene, camera)
    }
    window.addEventListener('resize', onResize)

    // CLEANUP
    onUnmounted(() => {
        disposed = true
        if (animationId !== null) cancelAnimationFrame(animationId)
        if (scrollRaf) cancelAnimationFrame(scrollRaf)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mousedown', onMouseDown)
        window.removeEventListener('mouseup', onMouseUp)
        window.removeEventListener('touchstart', onTouchStart)
        window.removeEventListener('touchend', onTouchEnd)
        window.removeEventListener('touchmove', onTouchMove)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', onVisibilityChange)
        
        if (particles) {
            particles.geometry.dispose()
            ;(particles.material as THREE.Material).dispose()
        }
        customUniforms.uTexture.value?.dispose()
        dummyPlane.geometry.dispose()
        ;(dummyPlane.material as THREE.Material).dispose()
        if (renderer) renderer.dispose()
    })
})
</script>

<template>
    <div id="canvas-container" ref="containerRef" aria-hidden="true">
        <div id="loader" ref="loaderRef" :class="{ 'has-error': loadError }">
            <div v-if="!loadError" class="spinner"></div>
            <div class="loading-text">{{ loadError ? '3D portrait unavailable' : 'Initializing...' }}</div>
        </div>
    </div>
</template>

<style scoped>
    /* The canvas overlays the entire screen to allow particles to fly everywhere. */
    #canvas-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1; 
        /* Allow clicks to pass through to underlying website content */
        pointer-events: none; 
        overflow: hidden;
    }
    
    /* Loading Container */
    #loader {
        position: fixed; 
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        transition: opacity 0.5s ease;
        z-index: 10;
    }
    
    /* Spinner Animation */
    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(127, 127, 127, 0.3);
        border-radius: 50%;
        border-top-color: #888888;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 12px;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .loading-text {
        font-family: sans-serif;
        font-size: 14px;
        font-weight: 600;
        color: #888888;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    #loader.has-error .loading-text {
        max-width: 220px;
        text-align: center;
        line-height: 1.4;
    }

    .hidden { opacity: 0; pointer-events: none; }

    @media (prefers-reduced-motion: reduce) {
        .spinner {
            animation: none;
        }
    }
</style>
