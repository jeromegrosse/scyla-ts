import * as THREE from 'three';
import { Body, EntityType } from './Body';
import { Collision } from './Collision';
import { SphereBody, PlaneBody } from './Shapes';

export class World {
    public bodies: Body[] = [];
    public gravity: THREE.Vector3 | null = null;
    public gravityOn: boolean = false;
    public grabbedEntity: Body | null = null;

    constructor() { }

    public setGravity(gravity: THREE.Vector3): void {
        if (!this.gravityOn) {
            this.gravity = gravity;
            this.gravityOn = true;
            for (const body of this.bodies) {
                body.setGravity(gravity);
            }
        }
    }

    public addBody(body: Body): void {
        this.bodies.push(body);
        if (this.gravityOn && this.gravity) {
            body.setGravity(this.gravity);
        }
    }

    public removeBody(body: Body): void {
        const index = this.bodies.indexOf(body);
        if (index !== -1) {
            this.bodies.splice(index, 1);
        }
    }

    public update(): void {
        // Update positions
        for (const body of this.bodies) {
            body.applyForces();
        }

        // Collision detection
        let firstMoving = false;
        for (let i = 0; i < this.bodies.length - 1; i++) {
            const a = this.bodies[i];
            firstMoving = a.isMoving();

            for (let j = i + 1; j < this.bodies.length; j++) {
                const b = this.bodies[j];

                if (firstMoving || b.isMoving()) {
                    if (Collision.collide(a, b)) {
                        // Collision resolved in collide method
                        // Stop if very slow (friction/sleep)
                        if (a.speed.lengthSq() < 1e-2) a.speed.set(0, 0, 0);
                        if (b.speed.lengthSq() < 1e-2) b.speed.set(0, 0, 0);
                    }
                }
            }
        }
    }

    public pickEntity(raycaster: THREE.Raycaster): Body | null {
        // Find intersected objects
        const meshes = this.bodies.map(b => b.mesh).filter(m => m !== null) as THREE.Object3D[];
        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            const body = this.bodies.find(b => b.mesh === object);
            if (body && body.type === EntityType.DYNAMIC_PICKABLE) {
                this.releaseEntity();
                this.grabbedEntity = body;
                body.grab();
                return body;
            }
        }
        return null;
    }

    public releaseEntity(): void {
        if (this.grabbedEntity) {
            this.grabbedEntity.release();
            if (this.gravity) {
                this.grabbedEntity.setGravity(this.gravity);
            }
            this.grabbedEntity = null;
        }
    }

    public addSphere(radius: number, position: THREE.Vector3, mass: number = 2): SphereBody {
        const sphere = new SphereBody(radius, position);
        sphere.setMass(mass);
        this.addBody(sphere);
        return sphere;
    }

    public addPlane(width: number, length: number, position: THREE.Vector3): PlaneBody {
        const plane = new PlaneBody(width, length, new THREE.Vector3(0, 1, 0), position);
        this.addBody(plane);
        return plane;
    }
}
