let tina, thing

function setup() {
    createCanvas(windowWidth, windowHeight)
    tina = new Tina(width, height)

    tina.pos = [0, 0, 2]

    const bounce = 'pow(sin(time * .2), 2.)';
    thing = tina.shape({
        sdFunc: `(
            sdTorus(pos, vec2(.8, .2))
        ) * ${bounce} + (
            sdBox(pos, vec3(.6))
        ) * (1. - ${bounce})`,
        shininess: 2048,
        color: [0, 0.9, 0.8],
    })

    tina.build()
    tina.fov = 100
}


function draw() {
    thing.rotation[0] += 0.006
    thing.rotation[1] += 0.006
    const graphics = tina.update()
    image(graphics, 0, 0, width, height)
}
