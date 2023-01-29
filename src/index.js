import domready from "domready"
import "./style.css"
import SimplexNoise from "simplex-noise"
import { randomPaletteWithBlack } from "./randomPalette"


const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;
const DEG2RAD_FACTOR = TAU / 360;

const config = {
    width: 0,
    height: 0
};

/**
 * @type CanvasRenderingContext2D
 */
let ctx
let canvas
let noise

class ArcPtr
{
    x
    y
    x0
    y0
    r
    angle
    id
    spin
    speed
    lifeTime
    pow = 1
    noiseScale = 0

    color = "#f00"

    constructor(speed = SPEED, noiseScale = 0.05)
    {
        this.id = Math.random()
        this.speed = speed
        this.noiseScale = noiseScale
        this.init(0,0,Math.random() * TAU)
    }

    randomRadius()
    {
        return Math.round(25 + Math.pow(Math.random(),this.pow) * 50)
    }

    
    init(x,y,angle, r = this.randomRadius())
    {
        const { speed } = this
        this.x = x
        this.y = y
        this.r = r
        this.angle = angle
        this.pow = 1 + Math.random() * 2
        this.spin = speed/(TAU * this.r)
        this.lifeTime = Math.round(50 + Math.random() * 50)
    }

    next()
    {
        const { x, y, r, angle, spin, id, noiseScale } = this

        const x0 = x + Math.cos(angle) * r
        const y0 = y + Math.sin(angle) * r
        if (--this.lifeTime > 0)
        {
            this.angle += spin

            this.x0 = x0
            this.y0 = y0
        }
        else
        {
            const newRadius = this.randomRadius();

            const combinedRadius = this.r + newRadius
            const x0 = this.x + Math.cos(angle) * combinedRadius
            const y0 = this.y + Math.sin(angle) * combinedRadius

            this.speed = -this.speed
            this.init(
                x0,y0,
                angle + TAU * 0.5,
                newRadius
            )
            return this.next()
        }

        return noise.noise3D(x0 * noiseScale, y0 * noiseScale, id)
    }

}

function fract(n)
{
    return n - Math.floor(n)
}

const SPEED = 10
let activeRun = 0
let runLength
domready(
    () => {

        canvas = document.getElementById("screen");
        ctx = canvas.getContext("2d");

        const width = (window.innerWidth) | 0;
        const height = (window.innerHeight) | 0;

        config.width = width;
        config.height = height;

        canvas.width = width;
        canvas.height = height;

        const paint = () => {

            const curr = ++activeRun
            runLength = Math.round(500 + Math.random() * 200)

            console.log("RUN #", curr, ", len = ", runLength)

            noise = new SimplexNoise()


            const cx = width >> 1
            const cy = height >> 1

            let x = cx, y = cy


            const count = 100

            const coords = []
            for (let i = 0; i < count; i++)
            {
                coords.push(
                    Math.random() * width,
                    Math.random() * height,
                    0
                )

            }

            const palette = randomPaletteWithBlack();
            ctx.fillStyle = palette[0]
            ctx.fillRect(0,0,width,height)

            const ptrs = Array.from({length: 3 * count}).map((o,i) => new ArcPtr(i % 3 === 2 ? 5 : 1))
            const colors = Array.from({length: count}).map((o,i) => palette[0|Math.random() * palette.length] )

            const animate = () => {

                for (let i = 0; i < 3; i++)
                {
                    for (let j = 0; j < ptrs.length; j += 3)
                    {
                        const x = coords[j    ]
                        const y = coords[j + 1]
                        const dxPtr = ptrs[j    ]
                        const dyPtr = ptrs[j + 1]
                        const  rPtr = ptrs[j + 2]

                        coords[j    ] += dxPtr.next() * 2
                        coords[j + 1] += dyPtr.next() * 2

                        const r = 1 + Math.pow(0.5 + rPtr.next() * 0.5, 5) * 12

                        ctx.fillStyle = colors[j/3]
                        ctx.beginPath()
                        ctx.moveTo(x+r,y)
                        ctx.arc(x,y,r,0,TAU, true)
                        ctx.fill()
                    }
                }

                if (curr === activeRun && runLength-- > 0)
                {
                    requestAnimationFrame(animate)
                }
            }
            requestAnimationFrame(animate)
        }

        paint()

        canvas.addEventListener("click", paint, true)
    }
);
