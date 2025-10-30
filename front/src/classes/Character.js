export default class Character {
    constructor(idCharacter) {
        this.idCharacter = idCharacter
        this.name = ""
        this.lynchVotes = 0
        this.mayorVotes = 0
        this.isAlive = true
        this.isLobizon = false
        this.objective = ""
        this.consecratedToPombero = false
        this.wasManipulated = false
    }

    voteLynch(idCharacter) {
        if (!this.isAlive) {
            console.log(`${this.name} no puede votar porque está muerto`)
            return null
        }
        console.log(`${this.name} vota para linchar a ${idCharacter}`)
        return idCharacter
    }

    voteMayor(idCharacter) {
        if (!this.isAlive) {
            console.log(`${this.name} no puede votar porque está muerto`)
            return null
        }
        console.log(`${this.name} vota para intendente a ${idCharacter}`)
        return idCharacter
    }

    death() {
        this.isAlive = false
        console.log(`${this.name} ha muerto`)
    }

    consecrate(pombero) {
        if (this.name=="pombero") {
            return false
        }

        if (this.consecratedToPombero) {
            console.log(`${this.name} ya está consagrado al Pombero`)
            return false
        }

        this.consecratedToPombero = true

        if (pombero) {
            pombero.registerConsecration(this)
        }
        console.log(` ${this.name} se consagra al Pombero para protección`)

        if (this.isLobizon) {
            console.log(" ¡PELIGRO! Un Lobizón se consagró al Pombero")
        }
        return true
    }
}