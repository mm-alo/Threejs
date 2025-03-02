import * as THREE from 'three';
// import WebGL from 'three/addons/capabilities/WebGL.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as CANNON from 'cannon-es';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf5f5f5); // Light gray for a cleaner look

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, -3);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));
document.body.appendChild(renderer.domElement);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Room setup
const roomMaterial = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });
const walls = [
    new THREE.Mesh(new THREE.BoxGeometry(14, 5, 0.1), roomMaterial), // Back wall
    new THREE.Mesh(new THREE.BoxGeometry(14, 5, 0.1), roomMaterial), // Front wall
    new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 8), roomMaterial), // Left wall
    new THREE.Mesh(new THREE.BoxGeometry(0.1, 5, 8), roomMaterial), // Right wall
    new THREE.Mesh(new THREE.BoxGeometry(14, 0.1, 8), roomMaterial), // Ceiling
];
walls[0].position.set(0, 2.5, -4.5);
walls[1].position.set(0, 2.5, 4.5);
walls[2].position.set(-7, 2.5, 0);
walls[3].position.set(7, 2.5, 0);
walls[4].position.set(0, 5, 0);
walls.forEach(wall => scene.add(wall));

// Floor
const floorGeometry = new THREE.PlaneGeometry(14, 8);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xd0d0d0 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Table rotated to Y-axis
const tableGeometry = new THREE.BoxGeometry(3, 0.2, 7);
const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.position.y = 0;
scene.add(table);

const tableEdgesGeometry = new THREE.EdgesGeometry(tableGeometry);
const tableEdgesMaterial = new THREE.LineBasicMaterial({ color: 0x9400D3 });
const tableEdges = new THREE.LineSegments(tableEdgesGeometry, tableEdgesMaterial);
table.add(tableEdges);

// Net same width as table, rotated to match
const netGeometry = new THREE.PlaneGeometry(3, 0.5, 20, 10);
const netMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, wireframe: true });
const net = new THREE.Mesh(netGeometry, netMaterial);
net.position.set(0, 0.25, 0);
scene.add(net);

// Ball
const ballGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 0.2, 0);
scene.add(ball);

// Paddle
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
scene.add(controller1, controller2);

function createPaddle(color, controller) {
    const paddleHandleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 32);
    const paddleBladeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.02, 32);
    const paddleMaterial = new THREE.MeshStandardMaterial({ color });
    
    const paddleHandle = new THREE.Mesh(paddleHandleGeometry, paddleMaterial);
    paddleHandle.position.set(0, -0.15, 0);
    
    const paddleBlade = new THREE.Mesh(paddleBladeGeometry, paddleMaterial);
    paddleBlade.rotation.z = Math.PI / 2;
    paddleBlade.position.set(0, 0, 0.15);
    
    const paddle = new THREE.Group();
    paddle.add(paddleHandle);
    paddle.add(paddleBlade);
    controller.add(paddle);
    return paddle;
}

createPaddle(0xff0000, controller1);
createPaddle(0x0000ff, controller2);


// Additional objects (chairs, scoreboard, banners)
const scoreboardGeometry = new THREE.BoxGeometry(1.5, 0.75, 0.1);
const scoreboardMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
const scoreboard = new THREE.Mesh(scoreboardGeometry, scoreboardMaterial);
scoreboard.position.set(0, 2, -4.4);
scene.add(scoreboard);

// Score tracker
const scoreCanvas = document.createElement('canvas');
scoreCanvas.width = 256;
scoreCanvas.height = 128;
const scoreContext = scoreCanvas.getContext('2d');
scoreContext.fillStyle = 'white';
scoreContext.font = '40px Arial';
scoreContext.fillText('0 - 0', 80, 80);

const scoreTexture = new THREE.CanvasTexture(scoreCanvas);
const scoreMaterial = new THREE.MeshBasicMaterial({ map: scoreTexture });
const scoreMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), scoreMaterial);
scoreMesh.position.set(0, 2, -4.35);
scene.add(scoreMesh);

const bannerGeometry = new THREE.PlaneGeometry(4, 1.5);
const bannerMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
const banner = new THREE.Mesh(bannerGeometry, bannerMaterial);
banner.position.set(0, 3.5, -4.4);
scene.add(banner);


// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Animation loop
function animate() {
    renderer.setAnimationLoop(() => {
        world.step(1 / 60);
        renderer.render(scene, camera);
    });
}

animate();
