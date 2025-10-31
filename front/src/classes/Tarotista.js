import Character from "./Character";

export default class Tarotista extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Tarotista"
        this.objective = "Linchar a todos los lobizones"
        this.readingsDone = []
    }

   
    leerAura(idCharacter, invesigatedCharacter) {

        this.readingsDone.push({
            objective: idCharacter,
            isLobizon: invesigatedCharacter.isLobizon,
            turn: Date.now()
        })

        console.log(`🔮 TAROTISTA lee el aura de ${idCharacter}`)
        
        return {
            objective: idCharacter,
            isLobizon: invesigatedCharacter.isLobizon,
            reliable: true 
        }
    }

    obtainHistory() {
        return this.readingsDone
    }

    
    
}