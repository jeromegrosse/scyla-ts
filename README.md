# Scyla-TS Physics Engine

This project is a modern web port of a custom 3D physics engine originally written in Java and LWJGL (Lightweight Java Game Library) over [10 years ago](https://github.com/jeromegrosse/scyla).

It replicates the core physics logic (Euler integration, impulse-based collision resolution) in TypeScript, using **Three.js** for rendering.

## Features

- **Custom Physics**: A from-scratch implementation of rigid body dynamics (spheres and planes).
- **FPS Controls**: First-person shooter style controls (WASD + Mouse Look).
- **Interaction**: Pick up, carry, and throw objects.
    - **Click** to grab an object (it will highlight).
    - **Click again** to release it.

## How to Run

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```

3.  Open your browser at `http://localhost:3000`.
