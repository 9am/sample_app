import Module from './plugins/lsd/lsd.mjs';

const LSD = Module();
const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
            display: inline-block;
            font-size: 0;
        }
        path {
            stroke: var(--victor-stroke, grey);
            stroke-width: var(--victor-stroke-width, 2);
            stroke-linecap: var(--victor-stroke-linecap, round);
        }
    </style>
    <svg id="svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <path id="path" fill="none" stroke="grey" stroke-width="2" stroke-linecap="round" />
    </svg>
`;

export const groupLines = (lines = []) => {
    if (!lines.length) {
        return [];
    }
    let [l, ...rest] = [...lines];
    let result = [[l]];
    let repeat = 0;
    while (rest.length) {
        const [, , x, y] = l;
        const [index, d, next] = rest.reduce((memo, line, i) => {
            const [x1, y1, x2, y2] = line;
            const dist1 = Math.hypot(x1 - x, y1 - y);
            const dist2 = Math.hypot(x2 - x, y2 - y);
            const dist = Math.min(dist1, dist2);
            return dist < memo[1]
                ? [i, dist, dist === dist2 ? [x2, y2, x1, y1] : line]
                : memo;
        }, [0, Number.MAX_SAFE_INTEGER]);
        if (d < 15) {
            result[result.length - 1].push(next);
            repeat = 0;
            rest.splice(index, 1);
            l = next;
        } else {
            if (repeat === 2) {
                result.push([next]);
                repeat = 0;
                rest.splice(index, 1);
                l = next;
            } else {
                const [a, b, c, d] = result[result.length - 1].slice(-1)[0];
                const [ox, oy] = [Math.random() * 5, Math.random() * 5];
                const back = [c, d, a + (ox > 2 ? 1 : -1) * ox, b + (ox > 2 ? 1 : -1) * oy];
                result[result.length - 1].push(back);
                repeat++;
                l = back;
            }
        }
    }
    return result;
};

export class ImageVictor extends HTMLElement {
    static get observedAttributes() {
        return ['src'];
    }

    static loadImage(url = '') {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
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
        this._img = {};
        this._plugins = [];
    }

    async attributeChangedCallback(name, prev, next) {
        if (prev === next) {
            return;
        }
        switch (name) {
            case 'src':
                this._img = await ImageVictor.loadImage(this.src);
                this.render();
                break;
            default:
                break;
        }
    }

    render() {
        if (!this._img.data || !this._plugins.length) {
            return;
        }
        const { lines } = this._plugins.reduce(
            (memo, plugin = pass => pass) => ({
                ...memo,
                lines: plugin(memo),
            }),
            {
                data: this._img.data,
                width: this._img.width,
                height: this._img.height,
                lines: [],
            },
        );
        const lineGroup = groupLines(lines);
        const dList = lineGroup.map(
            group => 'M' + group.map(([x1, y1, x2, y2]) => `${x1},${y1} L${x2},${y2} `).join('L'),
        );
        this._$path.setAttribute('d', dList.join(''));
        console.log('render- lines:', lines.length, lineGroup.length);
        this._$svg.setAttribute('viewBox', `0 0 ${this._img.width} ${this._img.height}`);
        this.animate(this._$path, dList);
    }

    animate(path, dList) {
        const len = Math.max.apply(null, dList.map(
            d => {
                const ele = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                ele.setAttribute('d', d);
                return ele.getTotalLength();
            },
        ));
        path.style.transition = 'unset';
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        setTimeout(() => {
            // path.animate(
            //     [
            //         { strokeDashoffset: len },
            //         { strokeDashoffset: 0 },
            //     ],
            //     {
            //         duration: 5000,
            //         // iterations: Infinity,
            //     },
            // );
            path.style.transition = 'stroke-dashoffset 5s ease-in-out 0s';
            path.style.strokeDashoffset = '0';
        }, 0);
    }

    get src() {
        return this.getAttribute('src');
    }

    set src(val = '') {
        this.setAttribute('src', val);
    }

    get plugins() {
        return this._plugins;
    }

    set plugins(val = []) {
        this._plugins = val;
    }

    async connectedCallback() {
        const { translate } = await LSD;
        this.plugins = [
            translate,
            ...this.plugins,
        ];
        this.render();
        // console.log('lsd', lsd);
    }

    disconnectedCallback() {
        this._$svg = null;
        this._$path = null;
        this._img = null;
        this._plugins = null;
    }
}

window.customElements.define(
    'img-victor',
    ImageVictor,
);
