import Personaje from "./Personaje";

export default class Jubilado extends Personaje {
    constructor(idPersonaje) {
        super(idPersonaje)
        this.nombre = "Jubilado"
        this.objetivo = "Linchar a todos los lobizones"
        this.venganzaActivada = false
        this.asesino = null
    }

    activarVenganza(causaMuerte, objetivo = null) {

        console.log(`JUBILADO activa VENGANZA - Causa: ${causaMuerte}`)

        let victima = null

        switch (causaMuerte) {
            case "lobizon":
                victima = this.seleccionarLoboAleatorio(objetivo)
                break
            case "linchamiento":
                victima = objetivo
                break
            case "pocion_muerte":
                victima = objetivo
                break
        }

        if (victima) {
            console.log(`Jubilado se lleva consigo a ${victima}`)
            return {
                venganza: true,
                victima: victima,
                causa: causaMuerte
            }
        }

        return null
    }

    seleccionarLoboAleatorio(lobizones) {
        if (!lobizones || lobizones.length === 0) return null
        const lobosVivos = lobizones.filter(lobo => lobo.estaVivo)
        if (lobosVivos.length === 0) return null
        return lobosVivos[Math.floor(Math.random() * lobosVivos.length)].idPersonaje
    }

}