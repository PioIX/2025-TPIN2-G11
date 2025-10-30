import Character from "./Character";

export default class ViudaNegra extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Viuda Negra"
        this.objective = "Linchar a todos los lobizones"
        this.votosPostMortem = 2
        this.votosUsados = 0
    }


    votarLincharPostMortem(idCharacter) {
        if (this.isAlive) {
            console.log("La viuda negra debe estar muerta para usar votos post-mortem")
            return null
        }

        if (this.votosUsados >= this.votosPostMortem) {
            console.log("La viuda negra ya usó todos sus votos post-mortem")
            return null
        }

        this.votosUsados++
        console.log(`VIUDA NEGRA vota desde el más allá por ${idCharacter} (${this.votosUsados}/${this.votosPostMortem})`)
        
        return {
            voto: idCharacter,
            votosRestantes: this.votosPostMortem - this.votosUsados,
            esPostMortem: true
        }
    }

    death() {
        this.isAlive = false
        console.log(` ${this.name} muere y se convierte en espíritu vengativo (${this.votosPostMortem} votos post-mortem disponibles)`)
    }

    
    
}