export default class Personaje {
    constructor(idPersonaje) {
        this.idPersonaje = idPersonaje
        this.nombre = ""
        this.votosLinchar = 0
        this.votosIntendente = 0
        this.estaVivo = true
        this.esLobizon = false
        this.objetivo = ""
        this.consagradoAlPombero = false
        this.fueManipulado = false
    }

    votarLinchar(idPersonaje) {
        if (!this.estaVivo) {
            console.log(`${this.nombre} no puede votar porque está muerto`)
            return null
        }
        console.log(`${this.nombre} vota para linchar a ${idPersonaje}`)
        return idPersonaje
    }

    votarIntendente(idPersonaje) {
        if (!this.estaVivo) {
            console.log(`${this.nombre} no puede votar porque está muerto`)
            return null
        }
        console.log(`${this.nombre} vota para intendente a ${idPersonaje}`)
        return idPersonaje
    }

    morir() {
        this.estaVivo = false
        console.log(`${this.nombre} ha muerto`)
    }

    consagrarse(pombero) {
        if (this.nombre=="pombero") {
            return false
        }

        if (this.consagradoAlPombero) {
            console.log(`${this.nombre} ya está consagrado al Pombero`)
            return false
        }

        this.consagradoAlPombero = true

        if (pombero) {
            pombero.registrarConsagracion(this)
        }
        console.log(` ${this.nombre} se consagra al Pombero para protección`)

        if (this.esLobizon) {
            console.log(" ¡PELIGRO! Un Lobizón se consagró al Pombero")
        }
        return true
    }
}