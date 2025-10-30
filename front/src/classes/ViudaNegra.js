import Personaje from "./Personaje";

export default class ViudaNegra extends Personaje {
    constructor(idPersonaje) {
        super(idPersonaje)
        this.nombre = "Viuda Negra"
        this.objetivo = "Linchar a todos los lobizones"
        this.votosPostMortem = 2
        this.votosUsados = 0
    }


    votarLincharPostMortem(idPersonaje) {
        if (this.estaVivo) {
            console.log("La viuda negra debe estar muerta para usar votos post-mortem")
            return null
        }

        if (this.votosUsados >= this.votosPostMortem) {
            console.log("La viuda negra ya usó todos sus votos post-mortem")
            return null
        }

        this.votosUsados++
        console.log(`VIUDA NEGRA vota desde el más allá por ${idPersonaje} (${this.votosUsados}/${this.votosPostMortem})`)
        
        return {
            voto: idPersonaje,
            votosRestantes: this.votosPostMortem - this.votosUsados,
            esPostMortem: true
        }
    }

    morir() {
        this.estaVivo = false
        console.log(` ${this.nombre} muere y se convierte en espíritu vengativo (${this.votosPostMortem} votos post-mortem disponibles)`)
    }

    
    
}