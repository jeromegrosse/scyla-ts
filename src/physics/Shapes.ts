import { Body } from './Body';
import * as THREE from 'three';

export class SphereBody extends Body {
    public radius: number = 1;

    constructor(radius: number, position: THREE.Vector3 = new THREE.Vector3()) {
        super(position);
        this.radius = radius;
    }
}

export class PlaneBody extends Body {
    public normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
    public width: number = 10;
    public length: number = 10;

    constructor(width: number, length: number, normal: THREE.Vector3, position: THREE.Vector3 = new THREE.Vector3()) {
        super(position);
        this.width = width;
        this.length = length;
        this.normal.copy(normal).normalize();
        this.disableDynamic();
    }
}

export class BoxBody extends Body {
    public width: number = 1;
    public height: number = 1;
    public depth: number = 1;

    constructor(width: number, height: number, depth: number, position: THREE.Vector3 = new THREE.Vector3()) {
        super(position);
        this.width = width;
        this.height = height;
        this.depth = depth;
    }
}
