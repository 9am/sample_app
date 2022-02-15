const template = document.createElement('template');
template.innerHTML = `
    <style>
        :host {
        }
        text {
            font-size: 1em;
            font-weight: 700;
            font-family: 'Helvetica Neue', 'Arial Nova', Helvetica, Arial, sans-serif;
            fill: grey;
            stroke: #EFEEEE;
            stroke-width: 4;
            stroke-opacity: 1;
            stroke-linejoin: round;
            paint-order: stroke;
            filter: url(#inset-shadow);
        }
        #group {
            fill: whitesmoke;
            stroke: white;
            stroke-width: 0.4%;
            stroke-opacity: 1;
            filter: url(#inset-shadow);
        }
    </style>
    <svg id="svg" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" role="img" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid slice">
        <filter id="inset-shadow">
            <feOffset dx='0.8' dy='0.8' />
            <feGaussianBlur stdDeviation='0.6' result='offset-blur' />
            <feComposite
                operator='out'
                in='SourceGraphic'
                in2='offset-blur'
                result='inverse'
            />
            <feFlood
                flood-color='rgb(217, 210, 200)'
                flood-opacity='0.52'
                result='color'
            />
            <feComposite
                operator='in'
                in='color'
                in2='inverse'
                result='shadow'
            />
            <feComposite
                operator='over'
                in='shadow'
                in2='SourceGraphic'
            />
        </filter>
        <g id="group"></g>
        <text id="title" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"></text>
    </svg>
`;


export class Tile extends HTMLElement {
    static get observedAttributes() {
        return ['edge', 'title'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this._$group = this.shadowRoot.querySelector('#group');
        this._$title = this.shadowRoot.querySelector('#title');
    }

    async attributeChangedCallback(name, prev, next) {
        if (prev === next) {
            return;
        }
        switch (name) {
            case 'edge':
                this._render();
                break;
            case 'title':
                this._renderTitle();
                break;
            default:
                break;
        }
    }

    _render() {
        this._$group.innerHTML = '';
        this._$group.appendChild(
            this._createShapes({
                edge: this.edge,
            }),
        );
    }

    _renderTitle() {
        this._$title.innerHTML = this.title;
    }

    _getPoints({
        cx = 5, cy = 5, r = 5,
        th = Math.PI / 2 * 3, edge = 3,
    }) {
        const step = (Math.PI * 2) / edge;
        return Array
            .from({ length: edge })
            .map((_, i) => {
                const angle = th + i * step;
                return [
                    +(cx + r * Math.cos(angle)).toFixed(2),
                    +(cy + r * Math.sin(angle)).toFixed(2),
                ].join(' ');
            });
    }

    _createShapes({
        column = 20, row = 10,
        x = 5, y = 5, r = 5,
        edge,
        randomRotate = true,
        randomScale = true,
    }) {
        const fragment = document.createDocumentFragment();
        for (let j = 0; j < row; j++) {
            for (let i = 0; i < column; i++) {
                const finalEdge = edge || Math.ceil(Math.random() * 6 + 2);
                const overload = finalEdge > 8;
                const el = document.createElementNS('http://www.w3.org/2000/svg', overload ? 'circle' : 'polygon');
                let cx = x + i * r * 2;
                if (j % 2) {
                    cx -= r;
                }
                const cy = y + j * r * 2;
                if (overload) {
                    el.setAttribute('cx', cx);
                    el.setAttribute('cy', cy);
                    el.setAttribute('r', r - 1);
                } else {
                    const points = this._getPoints({
                        cx,
                        cy,
                        r: r - 1,
                        edge: finalEdge,
                        th: randomRotate ? Math.random() * Math.PI * 2 : null,
                    });
                    el.setAttribute('points', points);
                }
                const scale = randomScale ? Math.random() * 0.4 + 0.6 : 1;
                el.setAttribute(
                    'transform',
                    `translate(${cx} ${cy}) scale(${scale}, ${scale}) translate(-${cx} -${cy})`,
                );
                fragment.appendChild(el);
            }
        }
        return fragment;
    }

    connectedCallback() {
        if (!this.hasAttribute('edge')) {
            this.setAttribute('edge', null);
        }
        if (!this.hasAttribute('title')) {
            this.setAttribute('title', '');
        }
    }

    get edge() {
        return +this.getAttribute('edge');
    }

    set edge(val = null) {
        this.setAttribute('edge', val);
    }

    get title() {
        return this.getAttribute('title');
    }

    set title(val = '') {
        this.setAttribute('title', val);
    }

    disconnectedCallback() {
        this._$group = null;
    }
}

window.customElements.define(
    'shape-tile',
    Tile,
);
