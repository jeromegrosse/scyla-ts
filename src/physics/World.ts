import * as THREE from 'three';
import { Body, EntityType } from './Body';
import { Collision } from './Collision';
import { SphereBody, PlaneBody } from './Shapes';

import { SpatialHash } from './SpatialHash';

export class World {
    public bodies: Body[] = [];
    public gravity: THREE.Vector3 | null = null;
    public gravityOn: boolean = false;
    public grabbedEntity: Body | null = null;
    public collisionChecks: number = 0;

    private spatialHash: SpatialHash;

    constructor() {
        this.spatialHash = new SpatialHash(10); // Cell size 10
    }

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

        // Rebuild Spatial Hash
        this.spatialHash.clear();
        const dynamicBodies: Body[] = [];
        const globalBodies: Body[] = [];

        for (const body of this.bodies) {
            if (body instanceof PlaneBody) {
                globalBodies.push(body);
            } else {
                dynamicBodies.push(body);
                this.spatialHash.insert(body);
            }
        }

        // Collision detection
        this.collisionChecks = 0;
        for (const a of dynamicBodies) {
            // 1. Dynamic vs Dynamic (Optimized)
            const candidates = this.spatialHash.query(a);

            for (const b of candidates) {
                if (a.id < b.id) {
                    if (a.isMoving() || b.isMoving()) {
                        this.collisionChecks++;
                        if (Collision.collide(a, b)) {
                            if (a.speed.lengthSq() < 1e-2) a.speed.set(0, 0, 0);
                            if (b.speed.lengthSq() < 1e-2) b.speed.set(0, 0, 0);
                        }
                    }
                }
            }

            // 2. Dynamic vs Static (Global/Plane)
            for (const p of globalBodies) {
                this.collisionChecks++;
                if (Collision.collide(p, a)) {
                    if (a.speed.lengthSq() < 1e-2) a.speed.set(0, 0, 0);
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
            if (body && body.type === EntityType.DYNAMIC) {
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

    public getSpatialHashDebugData(): { cellSize: number, keys: string[] } {
        return this.spatialHash.getDebugData();
    }
}
