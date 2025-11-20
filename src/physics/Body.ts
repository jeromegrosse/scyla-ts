import * as THREE from 'three';

export enum EntityType {
    DYNAMIC_PICKABLE,
    STATIC
}

export enum EntityState {
    MOVING,
    STILL
}

export class Body {
    // Graphic attributes (managed externally or linked)
    public mesh: THREE.Mesh | null = null;
    public color: { r: number, g: number, b: number } = { r: 0, g: 0, b: 0 };

    // Physic attributes
    public mass: number = 2;
    public invMass: number = 1 / 2;
    public bounce: number = 1.7;
    public dumping: number = 0.5;

    public type: EntityType = EntityType.DYNAMIC_PICKABLE;
    public state: EntityState = EntityState.MOVING;
    public isGrabbed: boolean = false;

    public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    public rotation: THREE.Vector3 = new THREE.Vector3(0, 0, 0); // Euler angles
    public speed: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    public gravity: THREE.Vector3 | null = null;

    constructor(position: THREE.Vector3 = new THREE.Vector3()) {
        this.position.copy(position);
    }

    public setPosition(position: THREE.Vector3): void {
        this.position.copy(position);
    }

    public setMass(mass: number): void {
        this.mass = mass;
        this.invMass = mass === 0 ? 0 : 1 / mass;
    }

    public setSpeed(speed: THREE.Vector3): void {
        this.speed.copy(speed);
    }

    public setGravity(gravity: THREE.Vector3): void {
        this.gravity = gravity.clone();
    }

    public enableDynamic(): void {
        this.type = EntityType.DYNAMIC_PICKABLE;
    }

    public disableDynamic(): void {
        this.type = EntityType.STATIC;
        this.speed.set(0, 0, 0);
    }

    /**
     * Applies physics forces (gravity) and updates position based on speed.
     * Also syncs the associated mesh position and rotation.
     */
    public applyForces(): void {
        if (this.type !== EntityType.STATIC) {
            if (!this.isGrabbed) {
                if (this.gravity) {
                    this.speed.add(this.gravity);
                }
            }

            // Always update position based on speed (even if grabbed)
            this.position.add(this.speed);
        }
        // Sync mesh if exists
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        }
    }

    public isMoving(): boolean {
        return this.speed.length() >= 0.05;
    }

    public applyImpulse(impulseVector: THREE.Vector3): void {
        this.speed.add(impulseVector);
    }

    public grab(): void {
        this.isGrabbed = true;
        this.speed.set(0, 0, 0);

        // Highlight
        if (this.mesh && this.mesh.material instanceof THREE.MeshPhongMaterial) {
            this.mesh.material.emissive.set(0x444444); // Gray glow
        }

        console.log("Entity grabbed");
    }

    public release(): void {
        this.isGrabbed = false;
        this.speed.set(0, 0, 0); // Stop movement on release so it falls straight down

        // Remove Highlight
        if (this.mesh && this.mesh.material instanceof THREE.MeshPhongMaterial) {
            this.mesh.material.emissive.set(0x000000); // No glow
        }

        console.log("Entity released");
    }
}
