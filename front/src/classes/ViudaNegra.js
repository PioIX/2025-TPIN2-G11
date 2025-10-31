import Character from "./Character";

export default class ViudaNegra extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Viuda Negra"
        this.objective = "Linchar a todos los lobizones"
        this.postMortemVotes = 2
        this.usedVotes = 0
    }


    votarLincharPostMortem(idCharacter) {
        if (this.isAlive) {
            console.log("La viuda negra debe estar muerta para usar votos post-mortem")
            return null
        }

        if (this.usedVotes >= this.postMortemVotes) {
            console.log("La viuda negra ya usó todos sus votos post-mortem")
            return null
        }

        this.usedVotes++
        console.log(`VIUDA NEGRA vota desde el más allá por ${idCharacter} (${this.usedVotes}/${this.postMortemVotes})`)
        
        return {
            vote: idCharacter,
            remainingVotes: this.postMortemVotes - this.usedVotes,
            isPostMortem: true
        }
    }

    death() {
        this.isAlive = false
        console.log(` ${this.name} muere y se convierte en espíritu vengativo (${this.postMortemVotes} votos post-mortem disponibles)`)
    }

    
    
}