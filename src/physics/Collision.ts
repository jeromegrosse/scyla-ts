import * as THREE from 'three';
import { Body } from './Body';
import { SphereBody, PlaneBody } from './Shapes';

export class Collision {

    /**
     * Checks for collision between two bodies and resolves it if detected.
     * @returns true if a collision was detected and resolved.
     */
    static collide(a: Body, b: Body): boolean {
        if (a instanceof SphereBody && b instanceof SphereBody) {
            // Sphere vs Sphere
            const n = new THREE.Vector3().subVectors(a.position, b.position);
            const R = a.radius + b.radius;

            if (n.lengthSq() < R * R) {
                n.normalize();

                const vA = a.speed;
                const vB = b.speed;

                const a1 = vA.dot(n);
                const a2 = vB.dot(n);

                const ma = a.mass;
                const mb = b.mass;
                const m = ma + mb;

                // Impulse scalar
                const P = 2 * (a1 - a2) / m;

                const impulseA = n.clone().multiplyScalar(-b.mass * P);
                const impulseB = n.clone().multiplyScalar(a.mass * P);

                if (!a.isGrabbed) a.applyImpulse(impulseA);
                if (!b.isGrabbed) b.applyImpulse(impulseB);

                return true;
            }
            return false;
        } else if (a instanceof PlaneBody && b instanceof SphereBody) {
            // Plane vs Sphere
            return Collision.resolvePlaneSphere(a, b);
        }


        return false;
    }

    private static resolvePlaneSphere(plane: PlaneBody, sphere: SphereBody): boolean {
        const posA = plane.position;
        const posB = sphere.position;
        const nA = plane.normal;

        const P = new THREE.Vector3().subVectors(posA, posB);
        const scalar = nA.dot(P); // Distance to plane along normal

        if (Math.abs(scalar) < sphere.radius) {
            // Collision detected

            // 1. Position Correction to avoid intersection
            sphere.position.y = plane.position.y + sphere.radius;

            // 2. Velocity Reflection
            const speed = sphere.speed;
            const bounce = sphere.bounce;
            const friction = 0.98;

            const nx = nA.x;
            const ny = nA.y;
            const nz = nA.z;

            const sx = speed.x;
            const sy = speed.y;
            const sz = speed.z;

            sphere.setSpeed(new THREE.Vector3(
                friction * (sx - bounce * nx * sx),
                sy - bounce * ny * sy,
                friction * (sz - bounce * nz * sz)
            ));

            return true;
        }

        return false;
    }
}
