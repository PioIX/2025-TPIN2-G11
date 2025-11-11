import Character from "./Character";

export default class Chaman extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Chamán"
        this.objective = "Linchar a todos los lobizones"
        this.lifePotion = true
        this.deathPotion = true
        this.usedLifePotion = false
        this.usedDeathPotion = false
    }

    useLifePotion(idCharacter) {

        if (!this.lifePotion || this.usedLifePotion) {
            console.log("Poción de vida no disponible")
            return false
        }

        this.usedLifePotion = true
        console.log(`CHAMÁN usa Poción de Vida en ${idCharacter}`)
        return {
            objective: idCharacter,
            type: "revivir",
            successful: true
        }
    }

    useDeathPotion(idCharacter) {

        if (!this.deathPotion || this.usedDeathPotion) {
            console.log("Poción de muerte no disponible")
            return false
        }

        this.usedDeathPotion = true
        console.log(`CHAMÁN usa Poción de Muerte en ${idCharacter}`)
        return {
            objective: idCharacter,
            type: "matar",
            successful: true
        }
    }

    potionsState() {
        return {
            lifePotion: this.lifePotion && !this.usedLifePotion,
            deathPotion: this.deathPotion && !this.usedDeathPotion
        }
    }
}