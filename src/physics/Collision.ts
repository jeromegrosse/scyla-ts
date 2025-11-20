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

            const distSq = n.lengthSq();
            if (distSq < R * R && distSq > 0) {
                const dist = Math.sqrt(distSq);
                n.multiplyScalar(1 / dist); // Normalize

                // 1. Position Correction (Projection)
                // Push bodies apart so they don't overlap
                const overlap = R - dist;
                const totalInvMass = a.invMass + b.invMass;

                if (totalInvMass > 0) {
                    const correction = n.clone().multiplyScalar(overlap / totalInvMass);
                    if (!a.isGrabbed && a.type !== 1) a.position.add(correction.clone().multiplyScalar(a.invMass));
                    if (!b.isGrabbed && b.type !== 1) b.position.sub(correction.clone().multiplyScalar(b.invMass));

                    if (a.mesh) a.mesh.position.copy(a.position);
                    if (b.mesh) b.mesh.position.copy(b.position);
                }

                // 2. Impulse Resolution
                const vA = a.speed;
                const vB = b.speed;
                const a1 = vA.dot(n);
                const a2 = vB.dot(n);
                const relVel = a1 - a2;

                // Do not resolve if velocities are separating
                if (relVel > 0) return false;

                const ma = a.mass;
                const mb = b.mass;

                // Impulse scalar
                // P = -(1 + e) * relVel / (1/ma + 1/mb)
                // Assuming e (bounce) is average of both bodies
                const e = (a.bounce + b.bounce) * 0.5;

                const impulseFactor = -(1 + e) * relVel / totalInvMass;
                const impulse = n.clone().multiplyScalar(impulseFactor);

                if (!a.isGrabbed) a.applyImpulse(impulse.clone().multiplyScalar(a.invMass));
                if (!b.isGrabbed) b.applyImpulse(impulse.clone().multiplyScalar(-b.invMass));

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
                friction * (sy - bounce * ny * sy),
                friction * (sz - bounce * nz * sz)
            ));

            return true;
        }

        return false;
    }
}
