import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import { World } from './physics/World';
import { DebugRenderer } from './DebugRenderer';
import { CollisionStats } from './CollisionStats';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: PointerLockControls;
    private world: World;
    private clock: THREE.Clock;
    private stats: Stats;
    private collisionStats: CollisionStats;

    private raycaster: THREE.Raycaster;
    private center: THREE.Vector2;

    private moveState = {
        forward: false,
        backward: false,
        left: false,
        right: false
    };

    private velocity = new THREE.Vector3();
    private direction = new THREE.Vector3();

    constructor() {
        // Setup Stats
        this.stats = new Stats();
        this.stats.dom.style.display = 'none';
        document.body.appendChild(this.stats.dom);

        // Setup Collision Stats
        this.collisionStats = new CollisionStats();

        // Setup Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // Setup Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 10, 20);

        // Setup Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('app')!.appendChild(this.renderer.domElement);

        // Setup UI
        this.setupUI();

        // Setup Controls
        this.controls = new PointerLockControls(this.camera, document.body);
        this.setupInputs();

        // Setup Lights
        this.setupLights();

        // Setup Physics World
        this.world = new World();
        this.world.setGravity(new THREE.Vector3(0, -0.01, 0));

        // Setup Initial Objects
        this.createInitialObjects();

        // Setup Helpers
        this.raycaster = new THREE.Raycaster();
        this.center = new THREE.Vector2(0, 0);
        this.clock = new THREE.Clock();

        // Handle Resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Setup Debug Renderer
        this.debugRenderer = new DebugRenderer(this.scene, this.world);
    }

    private setupUI(): void {
        const crosshair = document.createElement('div');
        crosshair.style.position = 'absolute';
        crosshair.style.top = '50%';
        crosshair.style.left = '50%';
        crosshair.style.width = '5px';
        crosshair.style.height = '5px';
        crosshair.style.backgroundColor = 'white';
        crosshair.style.border = '1px solid black';
        crosshair.style.borderRadius = '50%';
        crosshair.style.transform = 'translate(-50%, -50%)';
        crosshair.style.pointerEvents = 'none';
        document.body.appendChild(crosshair);
    }

    private setupInputs(): void {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveState.forward = true; break;
                case 'KeyA': this.moveState.left = true; break;
                case 'KeyS': this.moveState.backward = true; break;
                case 'KeyD': this.moveState.right = true; break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveState.forward = false; break;
                case 'KeyA': this.moveState.left = false; break;
                case 'KeyS': this.moveState.backward = false; break;
                case 'KeyD': this.moveState.right = false; break;
                case 'KeyP': this.toggleDebug(); break;
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (!this.controls.isLocked) {
                this.controls.lock();
                return;
            }

            if (event.button === 0) {
                this.shootSphere();
                return;
            }

            if (this.world.grabbedEntity) {
                this.world.releaseEntity();
            } else {
                this.raycaster.setFromCamera(this.center, this.camera);
                this.world.pickEntity(this.raycaster);
            }
        });

        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    private setupLights(): void {
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        this.scene.add(dirLight);
    }

    private createInitialObjects(): void {
        this.createPlane(10000, 10000, new THREE.Vector3(0, 0, 0));

        for (let i = 0; i < 50; i++) {
            this.createSphere(2, new THREE.Vector3(Math.random() * 2 - 1, 10 + i * 5, Math.random() * 2 - 1), Math.random() * 0xffffff);
        }
    }

    private createSphere(radius: number, position: THREE.Vector3, color: number, mass: number = 0) {
        // Physics
        const body = this.world.addSphere(radius, position, mass || radius);

        // Graphics
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        body.mesh = mesh;
        return body;
    }

    private createPlane(width: number, length: number, position: THREE.Vector3) {
        // Physics
        const body = this.world.addPlane(width, length, position);

        // Graphics
        const geometry = new THREE.PlaneGeometry(width, length);
        const material = new THREE.MeshPhongMaterial({ color: 0x999999, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        this.scene.add(mesh);

        body.mesh = mesh;
        body.rotation.x = -Math.PI / 2;

        return body;
    }

    private shootSphere(): void {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        // Start slightly in front of camera
        const position = this.camera.position.clone().add(direction.clone().multiplyScalar(2));

        const radius = Math.random() + 1;
        const color = Math.random() * 0xffffff;

        const body = this.createSphere(radius, position, color);

        // Set initial speed
        const speed = 4;
        body.setSpeed(direction.multiplyScalar(speed));
    }

    private onWindowResize(): void {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public start(): void {
        this.animate();
    }

    private debugMode: boolean = false;
    private debugRenderer: DebugRenderer;

    private toggleDebug(): void {
        this.debugMode = !this.debugMode;

        // Toggle Stats visibility
        this.stats.dom.style.display = this.debugMode ? 'block' : 'none';
        this.collisionStats.setVisible(this.debugMode);

        this.debugRenderer.setEnabled(this.debugMode);
    }

    private animate = (): void => {
        requestAnimationFrame(this.animate);

        this.stats.update();

        const delta = this.clock.getDelta();

        // Movement Logic
        if (this.controls.isLocked) {
            this.direction.z = Number(this.moveState.forward) - Number(this.moveState.backward);
            this.direction.x = Number(this.moveState.right) - Number(this.moveState.left);
            this.direction.normalize();

            if (this.moveState.forward || this.moveState.backward) this.velocity.z -= this.direction.z * 400.0 * delta;
            if (this.moveState.left || this.moveState.right) this.velocity.x -= this.direction.x * 400.0 * delta;

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);

            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
        }

        // Physics Interaction
        if (this.world.grabbedEntity) {
            const holdDistance = 20;
            const target = new THREE.Vector3();
            this.camera.getWorldDirection(target);
            target.multiplyScalar(holdDistance).add(this.camera.position);

            const direction = new THREE.Vector3().subVectors(target, this.world.grabbedEntity.position);
            this.world.grabbedEntity.speed.copy(direction.multiplyScalar(0.1));
        }

        // Apply physics
        this.world.update();

        // Debug Update
        this.debugRenderer.update();

        // Update Collision Stats
        this.collisionStats.update(this.world.collisionChecks);

        this.renderer.render(this.scene, this.camera);
    }
}
