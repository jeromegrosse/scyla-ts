import * as THREE from 'three';
import { World } from './physics/World';

export class DebugRenderer {
    private scene: THREE.Scene;
    private world: World;
    private mesh: THREE.LineSegments | null = null;
    private enabled: boolean = false;

    constructor(scene: THREE.Scene, world: World) {
        this.scene = scene;
        this.world = world;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!this.enabled) {
            this.clear();
        }
    }

    private clear(): void {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            if (Array.isArray(this.mesh.material)) {
                this.mesh.material.forEach(m => m.dispose());
            } else {
                this.mesh.material.dispose();
            }
            this.mesh = null;
        }
    }

    public update(): void {
        if (!this.enabled) return;

        this.clear();

        const data = this.world.getSpatialHashDebugData();
        const cellSize = data.cellSize;
        const keys = data.keys;

        const vertices: number[] = [];

        for (const key of keys) {
            const [cx, cy, cz] = key.split(',').map(Number);
            const x = cx * cellSize;
            const y = cy * cellSize;
            const z = cz * cellSize;

            // Box edges
            // Bottom face
            vertices.push(x, y, z, x + cellSize, y, z);
            vertices.push(x + cellSize, y, z, x + cellSize, y, z + cellSize);
            vertices.push(x + cellSize, y, z + cellSize, x, y, z + cellSize);
            vertices.push(x, y, z + cellSize, x, y, z);

            // Top face
            vertices.push(x, y + cellSize, z, x + cellSize, y + cellSize, z);
            vertices.push(x + cellSize, y + cellSize, z, x + cellSize, y + cellSize, z + cellSize);
            vertices.push(x + cellSize, y + cellSize, z + cellSize, x, y + cellSize, z + cellSize);
            vertices.push(x, y + cellSize, z + cellSize, x, y + cellSize, z);

            // Vertical lines
            vertices.push(x, y, z, x, y + cellSize, z);
            vertices.push(x + cellSize, y, z, x + cellSize, y + cellSize, z);
            vertices.push(x + cellSize, y, z + cellSize, x + cellSize, y + cellSize, z + cellSize);
            vertices.push(x, y, z + cellSize, x, y + cellSize, z + cellSize);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.LineSegments(geometry, material);
        this.scene.add(this.mesh);
    }
}
