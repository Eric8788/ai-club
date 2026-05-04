// ============================================================
// 🌊 Sailing Dodge - Retro Low-Poly Flat Style (V4)
// ============================================================

// --- Audio System (Kept simple) ---
class AudioSystem {
    constructor() { this.ctx = null; }
    init() {
        if (this.ctx) return;
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
    playTone(f, d, t='square', v=0.05) {
        if (!this.ctx) return;
        const o=this.ctx.createOscillator(), g=this.ctx.createGain();
        o.type=t; o.frequency.setValueAtTime(f, this.ctx.currentTime);
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime+d);
        o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime+d);
    }
    hit() { this.playTone(150, 0.3, 'sawtooth', 0.1); }
    dodge() { this.playTone(600, 0.1, 'square', 0.05); setTimeout(()=>this.playTone(800, 0.15, 'square', 0.05), 100); }
    warn() { this.playTone(400, 0.1, 'square', 0.04); setTimeout(()=>this.playTone(600, 0.1, 'square', 0.04), 150); }
}
const audio = new AudioSystem();


// --- Three.js Setup (Retro/Chunky configurations) ---
const canvas = document.getElementById('game-canvas');
// No antialiasing for sharp jagged edges!
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
// Crucial for the style: render at a fixed low vertical resolution, let CSS scale it up
const RENDER_HEIGHT = 480; 
let internalWidth = (window.innerWidth / window.innerHeight) * RENDER_HEIGHT;
renderer.setSize(internalWidth, RENDER_HEIGHT, false); 
renderer.setClearColor(0x66AADD);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x66AADD, 50, 250);

// Camera
const camera = new THREE.PerspectiveCamera(70, internalWidth / RENDER_HEIGHT, 0.1, 500);

// Lighting (Bright, flat, no shadows)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xfffff0, 1.2);
dirLight.position.set(100, 100, 50);
scene.add(dirLight);

// --- Materials Repository (Only Lambert for flat shading) ---
const matOcean = new THREE.MeshLambertMaterial({ color: 0xffffff, vertexColors: true, flatShading: true });
const matFoam  = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, flatShading: true });
const matHull  = new THREE.MeshLambertMaterial({ color: 0x999999, flatShading: true });
const matDeck  = new THREE.MeshLambertMaterial({ color: 0x777777, flatShading: true });
const matGreenRim = new THREE.MeshLambertMaterial({ color: 0x88CC44, flatShading: true });
const matMast  = new THREE.MeshLambertMaterial({ color: 0x555555, flatShading: true });
const matSail  = new THREE.MeshLambertMaterial({ color: 0xDDDDDD, flatShading: true, side: THREE.DoubleSide });
const matOutline = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
const matIsland = new THREE.MeshLambertMaterial({ color: 0x448833, flatShading: true });
const matCity  = new THREE.MeshLambertMaterial({ color: 0x778899, flatShading: true });


// --- Environment Building ---

// 1. Distant City Skyline
function createSkyline() {
    const group = new THREE.Group();
    for(let i=0; i<30; i++) {
        const w = 2 + Math.random()*4;
        const h = 2 + Math.random()*12;
        const geo = new THREE.BoxGeometry(w, h, w);
        const mesh = new THREE.Mesh(geo, matCity);
        const angle = -0.5 + Math.random()*1.0; // frontal horizon
        const dist = 180 + Math.random()*20;
        mesh.position.set(Math.sin(angle)*dist, h/2 - 2, -Math.cos(angle)*dist);
        group.add(mesh);
    }
    scene.add(group);
}
createSkyline();

// 2. Island
function createIsland() {
    const geo = new THREE.CylinderGeometry(15, 25, 4, 8);
    const mesh = new THREE.Mesh(geo, matIsland);
    mesh.position.set(-60, 0, -120);
    scene.add(mesh);
}
createIsland();

// 3. Clouds (Flat disjointed planes or simple boxes)
function createClouds() {
    for(let i=0; i<15; i++) {
        const geo = new THREE.BoxGeometry(10+Math.random()*15, 2, 5+Math.random()*5);
        const mesh = new THREE.Mesh(geo, matFoam);
        mesh.position.set((Math.random()-0.5)*200, 30+Math.random()*15, (Math.random()-0.5)*200 - 50);
        scene.add(mesh);
    }
}
createClouds();

// 4. Low-Poly Ocean (Animated via CPU)
const OCEAN_SIZE = 250;
const OCEAN_SEGS = 60; // High subdivision for sharp low-poly look
let baseOceanGeo = new THREE.PlaneGeometry(OCEAN_SIZE, OCEAN_SIZE, OCEAN_SEGS, OCEAN_SEGS);
baseOceanGeo.rotateX(-Math.PI/2);

// Crucial: non-indexed geometry ensures every triangle is separate to get true flat shading mosaic
const oceanGeo = baseOceanGeo.toNonIndexed();
baseOceanGeo.dispose();

// Vector map for wave offset caching and Add color attribute
const oceanColors = new Float32Array(oceanGeo.attributes.position.count * 3);
oceanGeo.setAttribute('color', new THREE.BufferAttribute(oceanColors, 3));

const ocean = new THREE.Mesh(oceanGeo, matOcean);
scene.add(ocean);

const cBlue = new THREE.Color(0x3377BB);
const cFoam = new THREE.Color(0xffffff);

function updateOcean(time) {
    const pos = oceanGeo.attributes.position;
    const col = oceanGeo.attributes.color;

    // Process every 3 vertices (1 triangle)
    for(let i=0; i<pos.count; i+=3) {
        let totalY = 0;
        
        for(let j=0; j<3; j++) {
            const idx = i + j;
            const x = pos.getX(idx);
            const z = pos.getZ(idx);
            
            // Complex choppier waves mixing multiple frequencies
            let y = Math.sin(x*0.15 + time*2.0) * 0.4
                  + Math.cos(z*0.18 - time*1.6) * 0.4
                  + Math.sin((x+z)*0.1 + time) * 0.5;

            // Add some noise irregularity
            y += Math.sin(x*0.4 + time*3)*0.15;
            
            // --- HUGE DYNAMIC SWELL FOR OBSTACLES ---
            for(let k=0; k<activeWaves.length; k++) {
                const w = activeWaves[k];
                const dx = x - w.x;
                const dz = z - w.z;
                // Wide along X, tight along Z for a broad horizontal wave
                const distSq = (dx*dx)/8.0 + (dz*dz)*1.5;
                const radiusSq = 60; // Overall thickness
                if (distSq < radiusSq) { 
                    const dist = Math.sqrt(distSq);
                    // Cosine curve for a natural swelling wave peak, lowered to 3.5 height
                    const swell = Math.cos((dist / Math.sqrt(radiusSq)) * (Math.PI/2)) * 3.5;
                    y += Math.max(0, swell);
                }
            }
            
            pos.setY(idx, y);
            totalY += y;
        }

        // Calculate color based on the FACE's average height (Foam Logic)
        const avgY = totalY / 3;
        const isFoam = avgY > 0.4;
        
        for(let j=0; j<3; j++) {
            const idx = i + j;
            if (isFoam) {
                col.setXYZ(idx, cFoam.r, cFoam.g, cFoam.b);
            } else {
                col.setXYZ(idx, cBlue.r, cBlue.g, cBlue.b);
            }
        }
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    oceanGeo.computeVertexNormals(); // Crucial for flatShading to work dynamically
}

// 5. White foam chunks floating on water
const foams = [];
function initFoam() {
    for(let i=0; i<40; i++) {
        const size = 1 + Math.random()*2;
        const geo = new THREE.BoxGeometry(size, 0.2, size); // Chunky boxes
        const mesh = new THREE.Mesh(geo, matFoam);
        mesh.position.set((Math.random()-0.5)*100, 0, (Math.random()-0.5)*100 - 20);
        mesh.rotation.y = Math.random() * Math.PI;
        scene.add(mesh);
        foams.push({ mesh, baseX: mesh.position.x, baseZ: mesh.position.z, speed: 0.5+Math.random() });
    }
}
initFoam();

function updateFoam(time, dt) {
    foams.forEach(f => {
        f.baseZ += f.speed * dt * 10; // Move backward to simulate forward sailing
        if(f.baseZ > 20) { f.baseZ -= 120; f.baseX = (Math.random()-0.5)*100; }
        
        f.mesh.position.x = f.baseX;
        f.mesh.position.z = f.baseZ;
        // Bob on water
        f.mesh.position.y = Math.sin(f.baseX*0.1 + time*2)*0.4 + Math.cos(f.baseZ*0.12 - time*1.5)*0.4;
    });
}


// --- The Boat Construction ---
const boat = new THREE.Group();

function addOutline(mesh, thicknessScale = 1.05) {
    const outline = new THREE.Mesh(mesh.geometry, matOutline);
    outline.position.copy(mesh.position);
    outline.rotation.copy(mesh.rotation);
    outline.scale.setScalar(thicknessScale);
    return outline;
}

// 1. Sleek Hull (Wide Deck, Pointed Bow)
const hullGeo = new THREE.BoxGeometry(4.5, 1.2, 10, 4, 1, 4);
const hPos = hullGeo.attributes.position;
for(let i=0; i<hPos.count; i++) {
    const x = hPos.getX(i);
    const y = hPos.getY(i);
    const z = hPos.getZ(i);
    
    // Front tapers to a point
    if (z < -2) {
        let taper = (z + 2) / -3; // 0 to 1
        hPos.setX(i, x * (1 - taper));
        hPos.setY(i, y + taper * 0.4); // Bow rises slightly
    }
    // Stern tapers slightly inward
    if (z > 2) {
        let taper = (z - 2) / 3;
        hPos.setX(i, x * (1 - taper * 0.15));
    }
    // Bottom V-shape but shallow
    if (y < 0) {
        hPos.setX(i, x * 0.5);
    }
}
hullGeo.computeVertexNormals();
const hull = new THREE.Mesh(hullGeo, matHull);
boat.add(hull);
boat.add(addOutline(hull, 1.05));

// 2. Deck Elements
const padGeo = new THREE.PlaneGeometry(2.0, 4);
padGeo.rotateX(-Math.PI/2);
const pad = new THREE.Mesh(padGeo, matGreenRim);
pad.position.set(0, 0.61, 1); 
boat.add(pad);

// 3. Mast (Taller, thinner)
const mastGeo = new THREE.CylinderGeometry(0.08, 0.1, 10, 6);
const mast = new THREE.Mesh(mastGeo, matMast);
mast.position.set(0, 5, -1);
boat.add(mast);
boat.add(addOutline(mast, 1.3));

// Rigging (Ropes)
const ropeGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 9.8, -1), // Top of mast
    new THREE.Vector3(0, 0.6, -3.8)  // Bow
]);
const ropeMat = new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 });
const rope1 = new THREE.Line(ropeGeo, ropeMat);
boat.add(rope1);

// 4. Sail Group (allows swing)
const sailGroup = new THREE.Group();
sailGroup.position.set(0, 0, -1); // Connect to mast base Z

// Boom (crossbar)
const boomGeo = new THREE.CylinderGeometry(0.06, 0.06, 4.5, 6);
boomGeo.rotateX(Math.PI/2);
const boom = new THREE.Mesh(boomGeo, matMast);
boom.position.set(0, 1.2, 2.2);
sailGroup.add(boom);
sailGroup.add(addOutline(boom, 1.3));

// Volumetric Sail (Custom tailored mapping tightly between Mast, Boom, and Top)
const sailGeo = new THREE.PlaneGeometry(4.5, 9, 6, 6);
const sailPos = sailGeo.attributes.position;
for(let i=0; i<sailPos.count; i++) {
    const x = sailPos.getX(i); // goes -2.25 to 2.25
    const y = sailPos.getY(i); // goes -4.5 to 4.5
    
    // U runs horizontally from 0 (Mast) to 1 (Leech edge)
    const u = (x + 2.25) / 4.5;
    const v = (y + 4.5) / 9.0;
    
    // Shrink the top edge so it forms a triangle
    const maxWidthAtV = 1.0 - v * 0.95; 
    
    // Stretch Z along the boom directly
    const lengthAlongBoom = u * maxWidthAtV * 4.4;
    
    // Puff it out into the +X direction (the "billow" of the sail due to wind)
    const puff = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 1.5;
    
    // Overwrite the geometry plane coordinates:
    sailPos.setX(i, puff);          // outward curve
    sailPos.setY(i, y + 4.5);       // shift up to ensure bottom is at local Y=0
    sailPos.setZ(i, lengthAlongBoom); // stretches along the boom towards stern
}
sailGeo.computeVertexNormals();

const sail = new THREE.Mesh(sailGeo, matSail);
sail.position.set(0, 1.2, 0); // Origin exactly on the boom joint!
sailGroup.add(sail);

sailGroup.rotation.y = Math.PI / 5; // Swing out dynamically
boat.add(sailGroup);

// Position boat ON the water
boat.position.set(0, 1.0, 0); 
scene.add(boat);


// --- Wave Obstacles & Splashes ---
const activeWaves = [];
// Create persistent splash particle pool
const splashGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
const splashes = [];
function triggerSplash(x, z) {
    for(let i=0; i<15; i++) {
        const mesh = new THREE.Mesh(splashGeo, matFoam);
        mesh.position.set(x + (Math.random()-0.5)*4, 1.0, z + (Math.random()-0.5)*4);
        scene.add(mesh);
        splashes.push({
            mesh,
            vx: (Math.random()-0.5)*15,
            vy: 5 + Math.random()*10,
            vz: 10 + Math.random()*20, // fly towards camera
            life: 1.0
        });
    }
}

function updateSplashes(dt) {
    for(let i=splashes.length-1; i>=0; i--) {
        const s = splashes[i];
        s.life -= dt;
        s.vy -= 30 * dt; // gravity
        s.mesh.position.x += s.vx * dt;
        s.mesh.position.y += s.vy * dt;
        s.mesh.position.z += s.vz * dt;
        s.mesh.rotation.x += dt * 10;
        s.mesh.rotation.y += dt * 12;
        if(s.life <= 0 || s.mesh.position.y < -2) {
            scene.remove(s.mesh);
            splashes.splice(i, 1);
        }
    }
}

function spawnObstacleWave() {
    // Generate a LOGICAL breaking foam wave obstacle - NO MESH! Will deform ocean mesh.
    const startX = -12 + Math.random()*8;
    const startZ = -80 - Math.random()*20;
    
    activeWaves.push({ 
        x: startX, 
        z: startZ, 
        zSpeed: 16 + Math.random()*6, // slowed down
        xSpeed: 2, 
        hit: false 
    });

    // Show warning UI
    const warnEl = document.getElementById('warning-message');
    warnEl.style.display = 'block';
    audio.warn();
    setTimeout(() => { if(warnEl) warnEl.style.display = 'none'; }, 1500);
}


// --- Game State & Input ---
const state = {
    running: false,
    score: 0,
    health: 3,
    isDodging: false,
    dodgePhase: 0,
    time: 0,
    spawnTimer: 0
};

function startGame() {
    audio.init();
    state.running = true;
    state.score = 0;
    state.health = 3;
    state.spawnTimer = 2; // Spawn first wave soon
    
    document.getElementById('start-screen').classList.remove('active');
    
    // Initial UI reset
    document.getElementById('score').innerText = '000';
    document.getElementById('dodge-state').innerText = 'FRONT';
    document.getElementById('dodge-state').style.color = '#aaddff';
}

function endGame() {
    state.running = false;
    document.getElementById('gameover-screen').classList.add('active');
    document.getElementById('final-score').innerText = state.score;
    
    // Cleanup waves
    activeWaves.forEach(w => scene.remove(w.mesh));
    activeWaves.length = 0;
}

window.restartGame = () => {
    document.getElementById('gameover-screen').classList.remove('active');
    startGame();
};

document.getElementById('start-screen').addEventListener('click', startGame);

document.addEventListener('keydown', e => {
    if(e.code === 'Space' && state.running && !state.isDodging) {
        state.isDodging = true;
        state.dodgePhase = 0;
        
        // UI feedback
        const btn = document.getElementById('center-message');
        btn.innerText = ">> DODGING <<";
        btn.classList.remove('blink');
        btn.style.color = "#ffff44";
        
        document.getElementById('dodge-state').innerText = 'DODGING';
        document.getElementById('dodge-state').style.color = '#ffff44';
        
        audio.dodge();
    }
});


// --- Hit Effect ---
function triggerHit() {
    state.health--;
    audio.hit();
    
    // UI Flash
    const flash = document.getElementById('flash-overlay');
    flash.classList.remove('flash-anim');
    void flash.offsetWidth; // trigger reflow
    flash.classList.add('flash-anim');
    
    // Shake canvas
    canvas.classList.remove('screen-shake');
    void canvas.offsetWidth;
    canvas.classList.add('screen-shake');
    
    if(state.health <= 0) {
        setTimeout(endGame, 500);
    }
}


// --- Main Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    
    if (state.running) {
        state.time += dt;
        state.score++;
        if(state.score % 10 === 0) {
            document.getElementById('score').innerText = String(Math.floor(state.score/10)).padStart(3, '0');
        }
        
        // Spawn Obstacles
        state.spawnTimer -= dt;
        if(state.spawnTimer <= 0) {
            spawnObstacleWave();
            state.spawnTimer = 2.5 + Math.random() * 2.0; // Random spawn interval
        }
        
        // Process active waves
        for(let i=activeWaves.length-1; i>=0; i--) {
            const w = activeWaves[i];
            w.z += w.zSpeed * dt;
            w.x += w.xSpeed * dt;
            
            // Collision zone check
            if (!w.hit && w.z > -5 && w.z < 5) {
                // If the wave is near the boat, check dodge state
                if(!state.isDodging) {
                    w.hit = true;
                    triggerHit();
                    triggerSplash(w.x, 0); // splash at boat
                }
            }
            
            // Clean up
            if (w.z > 20) {
                activeWaves.splice(i, 1);
            }
        }
        updateSplashes(dt);
    }

    // -- Animation Updates --
    updateOcean(state.time || clock.getElapsedTime());
    updateFoam(state.time || clock.getElapsedTime(), dt);

    // -- Boat Bobbing matched to exact Ocean math at (0,0) --
    let t = state.time || clock.getElapsedTime();
    let boatY = Math.sin(t*2.0)*0.4 + Math.cos(-t*1.6)*0.4 + Math.sin(t)*0.5; // base wave at x=0, z=0
    boatY += Math.sin(t*3)*0.15; // noise
    
    let wavePitch = 0;
    for(let k=0; k<activeWaves.length; k++) {
        const w = activeWaves[k];
        const dx = 0 - w.x;
        const dz = 0 - w.z;
        const distSq = (dx*dx)/8.0 + (dz*dz)*1.5;
        const radiusSq = 60;
        if (distSq < radiusSq) {
            const dist = Math.sqrt(distSq);
            const swell = Math.cos((dist / Math.sqrt(radiusSq)) * (Math.PI/2)) * 3.5;
            boatY += Math.max(0, swell);
            
            // Pitch calculation based on where the wave is relative to boat (Z is front/back)
            if(w.z < 2 && w.z > -10) wavePitch += swell * -0.06; // wave in front/under = pitch up gently!
        }
    }
    
    // Smooth lerping to soften passing over waves
    const targetY = 1.0 + boatY * 0.8;
    boat.position.y += (targetY - boat.position.y) * 8.0 * dt; 

    // Apply smooth pitch and idle roll
    const targetPitch = Math.sin(t*1.2) * 0.05 + wavePitch;
    boat.rotation.x += (targetPitch - boat.rotation.x) * 10.0 * dt;
    boat.rotation.z = Math.sin(t*0.8) * 0.08;
    
    // Camera Logic
    // Exact positioning based on reference image: 
    // Positioned LEFT rear of the boat deck, looking forward rightish across the bow.
    let baseCamX = -2.0; 
    let baseCamY = 2.4;
    let baseCamZ = 3.0;
    
    let camTargetRotY = -0.15; // Look slightly right
    let camTargetRotZ = 0.05; // Slight roll
    
    if(state.isDodging) {
        state.dodgePhase += dt * 3.0; // Speed of dodge animation
        
        if (state.dodgePhase < Math.PI) {
            // Roll right and pull back slightly
            camTargetRotZ = 0.05 - Math.sin(state.dodgePhase) * 0.4;
            baseCamX = -2.5 - Math.sin(state.dodgePhase) * 1.0;
        } else {
            // End dodge
            state.isDodging = false;
            const btn = document.getElementById('center-message');
            btn.innerText = "PRESS [SPACE] TO DODGE!";
            btn.classList.add('blink');
            btn.style.color = "white";
            
            document.getElementById('dodge-state').innerText = 'FRONT';
            document.getElementById('dodge-state').style.color = '#aaddff';
        }
    }

    // Apply to camera relative to boat's transform to "stick" it
    const localCamPos = new THREE.Vector3(baseCamX, baseCamY, baseCamZ);
    localCamPos.applyMatrix4(boat.matrixWorld);
    camera.position.lerp(localCamPos, 0.2);
    
    // Camera looks forward relative to boat orientation, with offset (Looking Rightish)
    const lookAtPos = new THREE.Vector3(5, 2, -20).applyMatrix4(boat.matrixWorld);
    camera.lookAt(lookAtPos);
    
    // Manually push roll (Z rotation) after lookAt
    camera.rotation.z = THREE.MathUtils.lerp(camera.rotation.z, camTargetRotZ + boat.rotation.z, 0.2);

    renderer.render(scene, camera);
}
animate();

// --- Handle Resize ---
window.addEventListener('resize', () => {
    internalWidth = (window.innerWidth / window.innerHeight) * RENDER_HEIGHT;
    renderer.setSize(internalWidth, RENDER_HEIGHT, false); // false prevents CSS override
    camera.aspect = internalWidth / RENDER_HEIGHT;
    camera.updateProjectionMatrix();
});
