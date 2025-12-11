// main.js - v0.3 (Fix Sécurité PointerLock & Éclairage Garanti)

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- CONFIGURATION ---
const CHUNK_SIZE = 16;

// Types de blocs
const BLOCKS = {
    AIR: 0, DIRT: 1, GRASS: 2, STONE: 3, 
    WOOD: 4, LEAVES: 5, PLANKS: 6, BRICK: 7
};

// Couleurs Vives (Pour être sûr qu'on les voit)
const BLOCK_COLORS = {
    [BLOCKS.DIRT]: '#8B4513',   // Marron
    [BLOCKS.GRASS]: '#32CD32',  // Vert Citron
    [BLOCKS.STONE]: '#A9A9A9',  // Gris
    [BLOCKS.WOOD]: '#5D4037',   // Bois fonce
    [BLOCKS.LEAVES]: '#006400', // Vert fonce
    [BLOCKS.PLANKS]: '#DEB887', // Beige
    [BLOCKS.BRICK]: '#800000'   // Rouge brique
};

const BLOCK_NAMES = {
    1: "Terre", 2: "Herbe", 3: "Pierre", 4: "Bois Brut", 
    5: "Feuilles", 6: "Planches", 7: "Pierre Taillée"
};

const RECIPES = [
    { id: "planks", name: "Planches", input: { id: BLOCKS.WOOD, count: 1 }, output: { id: BLOCKS.PLANKS, count: 4 } },
    { id: "brick", name: "Pierre Taillée", input: { id: BLOCKS.STONE, count: 2 }, input2: { id: BLOCKS.PLANKS, count: 1 }, output: { id: BLOCKS.BRICK, count: 4 } }
];

// --- TEXTURES (Génération Robustes) ---
function createTextureAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Fond de secours (Magenta pour repérer les bugs, mais on dessine par dessus)
    ctx.fillStyle = '#FF00FF';
    ctx.fillRect(0,0,128,128);

    const drawTile = (index, color) => {
        const x = (index % 4) * 32;
        const y = Math.floor(index / 4) * 32;
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 32, 32);
        
        // Bordure claire pour bien voir les cubes
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.strokeRect(x,y,32,32);
        
        // Bruit simple
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(x+8, y+8, 16, 16);
    };

    drawTile(0, BLOCK_COLORS[BLOCKS.DIRT]);
    drawTile(1, BLOCK_COLORS[BLOCKS.GRASS]); 
    drawTile(2, BLOCK_COLORS[BLOCKS.STONE]);
    drawTile(3, BLOCK_COLORS[BLOCKS.WOOD]);
    drawTile(4, BLOCK_COLORS[BLOCKS.LEAVES]);
    drawTile(5, BLOCK_COLORS[BLOCKS.PLANKS]);
    drawTile(6, BLOCK_COLORS[BLOCKS.BRICK]);
    
    // Side Herbe (Index 7 fictif)
    const xSide = 3*32, ySide = 1*32;
    ctx.fillStyle = BLOCK_COLORS[BLOCKS.DIRT];
    ctx.fillRect(xSide, ySide, 32, 32);
    ctx.fillStyle = BLOCK_COLORS[BLOCKS.GRASS];
    ctx.fillRect(xSide, ySide, 32, 10);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// --- MOTEUR ---
class VoxelInstancer {
    constructor(scene) {
        this.scene = scene;
        this.meshes = {}; 
        this.dummy = new THREE.Object3D();
        this.voxels = new Map();
        this.texture = createTextureAtlas();
    }

    init() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        // Lambert est plus performant et plus lumineux par défaut que Standard
        const material = new THREE.MeshLambertMaterial({ map: this.texture });

        Object.values(BLOCKS).forEach(type => {
            if (type === BLOCKS.AIR) return;
            
            const geo = geometry.clone();
            const uvs = geo.attributes.uv;
            let uIdx = 0, vIdx = 0;

            if(type === BLOCKS.DIRT) { uIdx=0; vIdx=0; }
            if(type === BLOCKS.GRASS) { uIdx=1; vIdx=0; }
            if(type === BLOCKS.STONE) { uIdx=2; vIdx=0; }
            if(type === BLOCKS.WOOD) { uIdx=3; vIdx=0; }
            if(type === BLOCKS.LEAVES) { uIdx=0; vIdx=1; }
            if(type === BLOCKS.PLANKS) { uIdx=1; vIdx=1; }
            if(type === BLOCKS.BRICK) { uIdx=2; vIdx=1; }

            // Hack: Mapping Herbe Côté (toutes faces)
            if (type === BLOCKS.GRASS) { uIdx=3; vIdx=1; } 

            const step = 0.25;
            for(let i=0; i < uvs.count; i++) {
                uvs.setXY(i, (uvs.getX(i)*step) + uIdx*step, (uvs.getY(i)*step) + vIdx*step);
            }
            geo.attributes.uv.needsUpdate = true;

            const mesh = new THREE.InstancedMesh(geo, material, 10000);
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.count = 0;
            this.scene.add(mesh);
            this.meshes[type] = mesh;
        });
    }

    setVoxel(x, y, z, type) {
        const key = `${x},${y},${z}`;
        if (type === BLOCKS.AIR) this.voxels.delete(key);
        else this.voxels.set(key, type);
    }

    getVoxel(x, y, z) {
        return this.voxels.get(`${x},${y},${z}`) || 0;
    }

    update() {
        for(let t in this.meshes) this.meshes[t].count = 0;

        this.voxels.forEach((type, key) => {
            const [x,y,z] = key.split(',').map(Number);
            // Culling simple
            if (this.isSolid(x+1,y,z) && this.isSolid(x-1,y,z) &&
                this.isSolid(x,y+1,z) && this.isSolid(x,y-1,z) &&
                this.isSolid(x,y,z+1) && this.isSolid(x,y,z-1)) return;

            const mesh = this.meshes[type];
            if (mesh && mesh.count < 10000) {
                this.dummy.position.set(x, y, z);
                this.dummy.updateMatrix();
                mesh.setMatrixAt(mesh.count++, this.dummy.matrix);
            }
        });
        for(let t in this.meshes) this.meshes[t].instanceMatrix.needsUpdate = true;
    }

    isSolid(x,y,z) {
        const t = this.getVoxel(x,y,z);
        return t !== BLOCKS.AIR && t !== BLOCKS.LEAVES;
    }

    generate() {
        const simplex = new SimplexNoise();
        const size = 32; 
        for (let x = -size; x < size; x++) {
            for (let z = -size; z < size; z++) {
                const n = simplex.noise2D(x/30, z/30);
                const h = Math.floor(n * 5 + 8); 
                
                for(let y=0; y<=h; y++) {
                    let t = BLOCKS.STONE;
                    if(y===h) t = BLOCKS.GRASS;
                    else if(y>h-3) t = BLOCKS.DIRT;
                    this.setVoxel(x, y, z, t);
                }
                
                // Arbre simple
                if(x % 7 === 0 && z % 7 === 0 && h > 5) {
                   this.setVoxel(x, h+1, z, BLOCKS.WOOD);
                   this.setVoxel(x, h+2, z, BLOCKS.WOOD);
                   this.setVoxel(x, h+3, z, BLOCKS.LEAVES);
                }
            }
        }
        this.update();
    }
}

// --- INIT SCENE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: false }); // Antialias false pour perf
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);

// --- ÉCLAIRAGE PUISSANT (Anti-Noir) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // 80% luminosité de base
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(50, 100, 50);
scene.add(dirLight);

// Setup Monde
const world = new VoxelInstancer(scene);
world.init();
world.generate();

// --- CONTROLES & ÉTAT DU JEU ---
const controls = new PointerLockControls(camera, document.body);
let isGameActive = false; // Nouvelle variable pour gérer l'état

const player = {
    velocity: new THREE.Vector3(),
    direction: new THREE.Vector3(),
    onGround: false,
    inventory: {}, 
    hotbar: [BLOCKS.DIRT, BLOCKS.STONE, BLOCKS.WOOD, 0, 0],
    selectedSlot: 0,
    gamemode: 'fps'
};
Object.values(BLOCKS).forEach(id => player.inventory[id] = 0);
camera.position.set(0, 20, 0);

// Selection
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let highlightMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.01, 1.01, 1.01),
    new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true, transparent: true, opacity: 0.5 })
);
scene.add(highlightMesh);
let intersectedBlock = null;

// --- BOUCLE DE JEU ---
function updatePhysics(delta) {
    // Si on vole ou si on est au sol, on freine
    player.velocity.x -= player.velocity.x * 10.0 * delta;
    player.velocity.z -= player.velocity.z * 10.0 * delta;
    
    // GRAVITÉ CONSTANTE (si pas en mode vol)
    if (player.gamemode === 'fps') {
        player.velocity.y -= 30.0 * delta; 
    } else {
        player.velocity.y -= player.velocity.y * 5.0 * delta;
    }

    const speed = player.gamemode === 'fly' ? 50.0 : 40.0;
    if (player.direction.z > 0) controls.moveForward(speed * delta);
    if (player.direction.z < 0) controls.moveForward(-speed * delta);
    if (player.direction.x > 0) controls.moveRight(speed * delta);
    if (player.direction.x < 0) controls.moveRight(-speed * delta);

    if (player.gamemode === 'fps') {
        const p = camera.position;
        // Collision simple au pied
        const voxelBelow = world.getVoxel(Math.round(p.x), Math.round(p.y - 1.6), Math.round(p.z));
        
        if (voxelBelow !== BLOCKS.AIR) {
            // Stop chute
            if(player.velocity.y < 0) {
                player.velocity.y = 0;
                player.onGround = true;
                // Repositionnement au dessus du bloc pour ne pas traverser
                const targetY = Math.round(p.y - 1.6) + 0.5 + 1.6;
                if(p.y < targetY) camera.position.y = targetY;
            }
        } else {
            player.onGround = false;
        }
    }
    
    // Mort si tombe trop bas
    if(camera.position.y < -20) {
        camera.position.set(0, 30, 0);
        player.velocity.set(0,0,0);
    }
}

// Raycasting
function updateRaycaster() {
    raycaster.setFromCamera(center, camera);
    const meshes = Object.values(world.meshes).filter(m => m.count > 0);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
        const hit = intersects[0];
        const matrix = new THREE.Matrix4();
        hit.object.getMatrixAt(hit.instanceId, matrix);
        const pos = new THREE.Vector3().setFromMatrixPosition(matrix);
        highlightMesh.position.copy(pos);
        highlightMesh.visible = true;
        intersectedBlock = { x: Math.round(pos.x), y: Math.round(pos.y), z: Math.round(pos.z), face: hit.face };
    } else {
        highlightMesh.visible = false;
        intersectedBlock = null;
    }
}

// UI & Logic
function updateUI() {
    const hotbarEl = document.getElementById('hotbar');
    if(!hotbarEl) return;
    hotbarEl.innerHTML = '';
    player.hotbar.forEach((itemId, idx) => {
        const slot = document.createElement('div');
        slot.className = 'slot' + (idx === player.selectedSlot ? ' active' : '');
        if(itemId !== 0) {
            slot.style.backgroundColor = BLOCK_COLORS[itemId];
            slot.innerHTML = `<span class="qty">${player.inventory[itemId] || 0}</span>`;
        }
        hotbarEl.appendChild(slot);
    });
    document.getElementById('selected-item-name').innerText = player.hotbar[player.selectedSlot] ? BLOCK_NAMES[player.hotbar[player.selectedSlot]] : "Main vide";
}

function selectSlot(idx) { player.selectedSlot = idx; updateUI(); }

// --- ENTRÉES UTILISATEUR ---
const onKeyDown = (event) => {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': player.direction.z = 1; break;
        case 'ArrowLeft': case 'KeyA': player.direction.x = 1; break;
        case 'ArrowDown': case 'KeyS': player.direction.z = -1; break;
        case 'ArrowRight': case 'KeyD': player.direction.x = -1; break;
        case 'Space': 
            if (player.onGround || player.gamemode === 'fly') player.velocity.y = 12; 
            break;
        case 'Digit1': selectSlot(0); break;
        case 'Digit2': selectSlot(1); break;
    }
};
const onKeyUp = (event) => {
    switch (event.code) {
        case 'ArrowUp': case 'KeyW': player.direction.z = 0; break;
        case 'ArrowLeft': case 'KeyA': player.direction.x = 0; break;
        case 'ArrowDown': case 'KeyS': player.direction.z = 0; break;
        case 'ArrowRight': case 'KeyD': player.direction.x = 0; break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
document.addEventListener('mousedown', (e) => {
    // Permet de miner même si pointerlock a échoué, tant que le jeu est actif
    if (!isGameActive) return;
    
    // Relance le lock si perdu
    if(document.pointerLockElement !== document.body) {
        controls.lock();
    }
    
    if (e.button === 0 && intersectedBlock) { // Mine
        world.setVoxel(intersectedBlock.x, intersectedBlock.y, intersectedBlock.z, BLOCKS.AIR);
        world.update();
        player.inventory[BLOCKS.DIRT]++;
        updateUI();
    }
    if (e.button === 2 && intersectedBlock) { // Place
        const b = player.hotbar[player.selectedSlot];
        if(b) {
            world.setVoxel(intersectedBlock.x + intersectedBlock.face.normal.x, intersectedBlock.y + intersectedBlock.face.normal.y, intersectedBlock.z + intersectedBlock.face.normal.z, b);
            world.update();
            updateUI();
        }
    }
});

// --- DÉMARRAGE ---
function startGame(mode) {
    player.gamemode = mode;
    document.getElementById('title-screen').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    
    isGameActive = true; // FORCE L'ACTIVATION DE LA PHYSIQUE
    
    // Tente de verrouiller, mais ne bloque pas le jeu si ça échoue
    try {
        controls.lock();
    } catch(e) {
        console.warn("Pointer lock failed, but game continues.");
    }
    updateUI();
}

document.getElementById('btn-play').onclick = () => startGame('fps');
document.getElementById('btn-fly').onclick = () => startGame('fly');

// --- LOOP PRINCIPALE ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);

    // CRUCIAL : On update la physique si le jeu est actif, 
    // INDÉPENDAMMENT du PointerLock
    if (isGameActive) {
        updatePhysics(delta);
        updateRaycaster();
    }

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});