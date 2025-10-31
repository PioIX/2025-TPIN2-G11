import Character from "./Character";

export default class Jubilado extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Jubilado"
        this.objective = "Linchar a todos los lobizones"
        this.venganzaActivada = false
        this.asesino = null
    }

    activarVenganza(causaMuerte, objective = null) {

        console.log(`JUBILADO activa VENGANZA - Causa: ${causaMuerte}`)

        let victima = null

        switch (causaMuerte) {
            case "lobizon":
                victima = this.seleccionarLoboAleatorio(objective)
                break
            case "linchamiento":
                victima = objective
                break
            case "pocion_muerte":
                victima = objective
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
        const lobosVivos = lobizones.filter(lobo => lobo.isAlive)
        if (lobosVivos.length === 0) return null
        return lobosVivos[Math.floor(Math.random() * lobosVivos.length)].idCharacter
    }

}