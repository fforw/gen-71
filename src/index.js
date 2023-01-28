import domready from "domready"
import "./style.css"
import SimplexNoise from "simplex-noise"
import Color from "./Color"

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
let ctx;
let canvas;
/**
 * @type CanvasRenderingContext2D
 */
let statsCtx;
let statsCanvas;
let noise;

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

    constructor(x,y,speed, angle = Math.random() * TAU, noiseScale = 0.05)
    {
        this.id = Math.random()
        this.speed = speed
        this.noiseScale = noiseScale
        this.init(x,y,angle)
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

        statsCanvas = document.createElement("canvas")
        statsCanvas.width = width
        statsCanvas.height = Math.round(height * 0.25)

        statsCanvas.style.position = "absolute"
        statsCanvas.style.bottom = "0"
        statsCanvas.style.left = "0"

        document.body.appendChild(statsCanvas)

        statsCtx = statsCanvas.getContext("2d")


        const paint = () => {

            const curr = ++activeRun

            ctx.fillStyle = "#000";
            ctx.fillRect(0,0, width, height);
            statsCtx.clearRect(0,0,width,statsCanvas.height);

            noise = new SimplexNoise()

            const pointers = Array.from({length: 3}).map( () => new ArcPtr(
                width>>1,
                height>>1,
                SPEED,
            ))
            const dy = Math.round(height * 0.75)
            const size = Math.min(width, dy)
            const dh = statsCanvas.height

            const cx = width >> 1
            const cy = dy >> 1

            const colors = pointers.map((ptr, idx) => Color.fromHSL(fract(PHI * idx), 0.5, 0.5).toRGBHex())

            const animate = () => {

                for (let i = 0; i < pointers.length; i++)
                {
                    let ptr = pointers[i]

                    const v = ptr.next()
                    ctx.fillStyle = colors[i]
                    ctx.fillRect( ptr.x0, ptr.y0,2,2)

                    statsCtx.globalCompositeOperation = "copy"
                    statsCtx.drawImage(
                        statsCanvas,
                        2,0,width - 2, dh,
                        0,0,width - 2, dh
                    )

                    statsCtx.globalCompositeOperation = "source-over"
                    statsCtx.clearRect( width - 2, 0,2,dh)
                    statsCtx.fillStyle = colors[i]
                    statsCtx.fillRect( width - 2, (0.5 + v * 0.5) * dh,2,2)
                }


                if (curr === activeRun)
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
