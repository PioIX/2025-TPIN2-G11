import Personaje from "./Personaje";

export default class Medium extends Personaje {
    constructor(idPersonaje) {
        super(idPersonaje)
        this.nombre = "Medium"
        this.objetivo = "Linchar a todos los lobizones"
        this.votosMuertos = 0
        this.muertosContactados = []
    }

    
    contactarMuertos(muertos) {

        console.log(`MEDIUM contacta a los muertos: ${muertos.length} espíritus`)
        this.muertosContactados = muertos
        
        const votosMuertos = this.obtenerVotoConjuntoMuertos(muertos)
        this.votosMuertos = votosMuertos
        
        return {
            votoConjunto: votosMuertos,
            cantidadMuertos: muertos.length
        }
    }

    votarLinchar(idPersonaje) {
        if (!this.estaVivo) return null

        console.log(` MEDIUM vota por ${idPersonaje} (2 votos: propio + muertos)`)
        return {
            votoPersonal: idPersonaje,
            votoMuertos: this.votosMuertos,
            totalVotos: 2
        }
    }

    obtenerVotoConjuntoMuertos(muertos) {
        if (muertos.length === 0) return null

        const votos = {}
        muertos.forEach(muerto => {
            const votoMuerto = this.calcularVotoMuerto(muerto)
            if (votoMuerto) {
                votos[votoMuerto] = (votos[votoMuerto] || 0) + 1
            }
        })

        return Object.keys(votos).reduce((a, b) => 
            votos[a] > votos[b] ? a : b
        )
    }

    

}