import { Body } from './Body';

export class SpatialHash {
    private cellSize: number;
    private cells: Map<string, Body[]>;

    constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    public insert(body: Body): void {
        // That's a small shortcut since we only have spheres.
        // We'll need to update that part if we create more complex shapes
        const r = body.radius;
        const minX = body.position.x - r;
        const minY = body.position.y - r;
        const minZ = body.position.z - r;
        const maxX = body.position.x + r;
        const maxY = body.position.y + r;
        const maxZ = body.position.z + r;

        // Compute the cells this object is in
        const startX = Math.floor(minX / this.cellSize);
        const endX = Math.floor(maxX / this.cellSize);
        const startY = Math.floor(minY / this.cellSize);
        const endY = Math.floor(maxY / this.cellSize);
        const startZ = Math.floor(minZ / this.cellSize);
        const endZ = Math.floor(maxZ / this.cellSize);

        // Add this into a set which key is the cell coordinates
        // allowing to not store a huge three-dimensional array
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                for (let z = startZ; z <= endZ; z++) {
                    const key = `${x},${y},${z}`;
                    if (!this.cells.has(key)) {
                        this.cells.set(key, []);
                    }
                    this.cells.get(key)!.push(body);
                }
            }
        }
    }

    public query(body: Body): Set<Body> {
        const candidates = new Set<Body>();

        // Compute the boundary of the object
        const r = body.radius;
        const minX = body.position.x - r;
        const minY = body.position.y - r;
        const minZ = body.position.z - r;
        const maxX = body.position.x + r;
        const maxY = body.position.y + r;
        const maxZ = body.position.z + r;

        // Compute the cells that we will need to check
        const startX = Math.floor(minX / this.cellSize);
        const endX = Math.floor(maxX / this.cellSize);
        const startY = Math.floor(minY / this.cellSize);
        const endY = Math.floor(maxY / this.cellSize);
        const startZ = Math.floor(minZ / this.cellSize);
        const endZ = Math.floor(maxZ / this.cellSize);

        // Iterate through the subset and pick all objects and the cells
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                for (let z = startZ; z <= endZ; z++) {
                    const key = `${x},${y},${z}`;
                    const cell = this.cells.get(key);
                    if (cell) {
                        for (const other of cell) {
                            if (other !== body) {
                                candidates.add(other);
                            }
                        }
                    }
                }
            }
        }

        return candidates;
    }

    public clear(): void {
        this.cells.clear();
    }

    public getDebugData(): { cellSize: number, keys: string[] } {
        return {
            cellSize: this.cellSize,
            keys: Array.from(this.cells.keys())
        };
    }
}
