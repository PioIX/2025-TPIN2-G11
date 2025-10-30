import Personaje from "./Personaje";

export default class Chaman extends Personaje {
    constructor(idPersonaje) {
        super(idPersonaje)
        this.nombre = "Chamán"
        this.objetivo = "Linchar a todos los lobizones"
        this.pocionVida = true
        this.pocionMuerte = true
        this.pocionVidaUsada = false
        this.pocionMuerteUsada = false
    }

    usarPocionVida(idPersonaje) {

        if (!this.pocionVida || this.pocionVidaUsada) {
            console.log("Poción de vida no disponible")
            return false
        }

        this.pocionVidaUsada = true
        console.log(`CHAMÁN usa Poción de Vida en ${idPersonaje}`)
        return {
            objetivo: idPersonaje,
            tipo: "revivir",
            exitoso: true
        }
    }

    usarPocionMuerte(idPersonaje) {

        if (!this.pocionMuerte || this.pocionMuerteUsada) {
            console.log("Poción de muerte no disponible")
            return false
        }

        this.pocionMuerteUsada = true
        console.log(`CHAMÁN usa Poción de Muerte en ${idPersonaje}`)
        return {
            objetivo: idPersonaje,
            tipo: "matar",
            exitoso: true
        }
    }

    estadoPociones() {
        return {
            pocionVida: this.pocionVida && !this.pocionVidaUsada,
            pocionMuerte: this.pocionMuerte && !this.pocionMuerteUsada
        }
    }
}