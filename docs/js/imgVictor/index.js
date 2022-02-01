import Pool from './pool.js';
const pool = new Pool({
    url: '/js/imgVictor/workers/lsd/lsd.js',
    size: window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency > 1
        ? 2
        : 1,
});

const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: inline-block;
            position: relative;
            font-size: 0;
            overflow: hidden;
        }
        path {
            stroke: var(--victor-stroke, grey);
            stroke-width: var(--victor-stroke-width, 2);
            stroke-linecap: var(--victor-stroke-linecap, round);
        }
        .loading {
            position: absolute;
            background-color: lightgray;
            width: 100%;
            height: 100%;
        }
        .loading::after {
            display: block;
            content: "";
            position: absolute;
            width: 100%;
            height: 100%;
            transform: translateX(-100%);
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            animation: loading 1.2s infinite;
        }
        @keyframes loading {
            100% {
                transform: translateX(100%);
            }
        }
    </style>
    <section id="loading"></section>
    <svg id="svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" role="img" aria-labelledby="title">
        <title id="title"></title>
        <path id="path" fill="none" stroke="grey" stroke-width="2" stroke-linecap="round" />
    </svg>
`;


export class ImageVictor extends HTMLElement {
    static get observedAttributes() {
        return ['src', 'title'];
    }

    static loadImage(url = '') {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { alpha: false });
                    ctx.imageSmoothingEnabled = false;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    resolve(ctx.getImageData(0, 0, img.width, img.height));
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = error => reject(error);
            img.src = url;
        });
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._$svg = this.shadowRoot.querySelector('#svg');
        this._$path = this.shadowRoot.querySelector('#path');
        this._$loading = this.shadowRoot.querySelector('#loading');
        this._$title = this.shadowRoot.querySelector('#title');
        this._img = {};
        this._dList = [];
    }

    async attributeChangedCallback(name, prev, next) {
        console.log('attr changed:', name, prev, next);
        if (prev === next) {
            return;
        }
        switch (name) {
            case 'src':
                try {
                    this._$loading.className = 'loading';
                    this._img = await ImageVictor.loadImage(this.src);
                    await this._renderPath();
                } finally {
                    this._$loading.className = '';
                }
                break;
            case 'title':
                this._renderTitle();
                break;
            default:
                break;
        }
    }

    _renderTitle() {
        this._$title.textContent = this.title;
    }

    async _renderPath() {
        if (!this._img.data) {
            return;
        }
        const [lines, groups] = await pool.addTask(this._img);
        // console.log('render- lines:', lines.length, groups.length);
        this._dList = groups.map(
            group => 'M' + group.map(([x1, y1, x2, y2]) => `${x1},${y1} L${x2},${y2} `).join('L'),
        );
        this._$path.setAttribute('d', this._dList.join(''));
        this._$svg.setAttribute('viewBox', `0 0 ${this._img.width} ${this._img.height}`);
        if (!this.noDraw) {
            this.draw();
        }
    }

    draw() {
        const len = Math.max.apply(null, this._dList.map(
            d => {
                const ele = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                ele.setAttribute('d', d);
                return ele.getTotalLength();
            },
        ));
        this._$path.style.strokeDasharray = len;
        this._$path.animate(
            [
                { strokeDashoffset: len },
                { strokeDashoffset: 0 },
            ],
            {
                duration: 5000,
                // iterations: Infinity,
            },
        );
    }

    get src() {
        return this.getAttribute('src');
    }

    set src(val = '') {
        this.setAttribute('src', val);
    }

    get title() {
        return this.getAttribute('title');
    }

    set title(val = '') {
        this.setAttribute('title', val);
    }

    get noDraw() {
        return Boolean(this.getAttribute('no-draw'));
    }

    set noDraw(val) {
        this.setAttribute('no-draw', Boolean(val));
    }

    connectedCallback() {
        if (!this.hasAttribute('src')) {
            this.setAttribute('src', '');
        }
        if (!this.hasAttribute('no-draw')) {
            this.setAttribute('no-draw', 'false');
        }
    }

    disconnectedCallback() {
        this._$svg = null;
        this._$path = null;
        this._$loading = null;
        this._$title = null;
        this._img = null;
        this._dList = null;
    }
}

window.customElements.define(
    'img-victor',
    ImageVictor,
);
