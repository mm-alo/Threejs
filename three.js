import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
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

// Table
const tableGeometry = new THREE.BoxGeometry(3, 0.2, 7);
const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
const table = new THREE.Mesh(tableGeometry, tableMaterial);
table.position.y = 0;
scene.add(table);

const tableEdgesGeometry = new THREE.EdgesGeometry(tableGeometry);
const tableEdgesMaterial = new THREE.LineBasicMaterial({ color: 0x9400D3 });
const tableEdges = new THREE.LineSegments(tableEdgesGeometry, tableEdgesMaterial);
table.add(tableEdges);

// Table physics
const tableBody = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(1.5, 0.1, 3.5)),
    position: new CANNON.Vec3(0, 0, 0)
});
world.addBody(tableBody);

// Net
const netGeometry = new THREE.PlaneGeometry(3, 0.5, 20, 10);
const netMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, wireframe: true });
const net = new THREE.Mesh(netGeometry, netMaterial);
scene.add(net);

// Ball with physics
const ballGeometry = new THREE.SphereGeometry(0.1, 32, 32);
const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
scene.add(ball);

const ballBody = new CANNON.Body({
    mass: 0.2,
    shape: new CANNON.Sphere(0.1),
    position: new CANNON.Vec3(0, 1.5, 1),
    restitution: 0.9
});
world.addBody(ballBody);

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
    paddleBlade.rotation.x = Math.PI / 2;
    paddleBlade.position.set(0, 0.15, 0);
    
    const paddle = new THREE.Group();
    paddle.add(paddleHandle);
    paddle.add(paddleBlade);
    controller.add(paddle);
    
    const paddleBody = new CANNON.Body({
        mass: 0,
        shape: new CANNON.Box(new CANNON.Vec3(0.3, 0.02, 0.3)),
    });
    world.addBody(paddleBody);
    
    return { paddle, paddleBody, controller };
}

const playerPaddle = createPaddle(0xff0000, controller1);
const opponentPaddle = createPaddle(0x0000ff, controller2);

// Sync paddles with controllers
function updatePaddlePositions() {
    [playerPaddle, opponentPaddle].forEach(({ paddle, paddleBody, controller }) => {
        const pos = new THREE.Vector3();
        controller.getWorldPosition(pos);
        paddle.position.copy(pos);
        paddleBody.position.set(pos.x, pos.y, pos.z);
    });
}

// Detect paddle-ball collision
function checkCollision() {
    [playerPaddle, opponentPaddle].forEach(({ paddleBody }) => {
        const distance = paddleBody.position.distanceTo(ballBody.position);
        if (distance < 0.35) {
            const direction = new CANNON.Vec3().copy(ballBody.position).vsub(paddleBody.position).normalize();
            ballBody.velocity.set(direction.x * 5, direction.y * 5, direction.z * 5);
        }
    });
}

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
        updatePaddlePositions();
        ball.position.copy(ballBody.position);
        checkCollision();
        renderer.render(scene, camera);
    });
}

animate();
