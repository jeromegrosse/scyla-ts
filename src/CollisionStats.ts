export class CollisionStats {
    private dom: HTMLDivElement;

    constructor() {
        this.dom = document.createElement('div');
        this.dom.style.position = 'absolute';
        this.dom.style.top = '0px';
        this.dom.style.left = '80px'; // Right of Stats
        this.dom.style.color = 'white';
        this.dom.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.dom.style.padding = '5px';
        this.dom.style.fontFamily = 'monospace';
        this.dom.style.fontSize = '12px';
        this.dom.textContent = 'Checks: 0';
        this.dom.style.display = 'none'; // Hide by default
        document.body.appendChild(this.dom);
    }

    public update(checks: number): void {
        this.dom.textContent = `Checks: ${checks}`;
    }

    public setVisible(visible: boolean): void {
        this.dom.style.display = visible ? 'block' : 'none';
    }
}
