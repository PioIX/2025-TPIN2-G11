import Character from "./Character";

export default class Lobizon extends Character {
    constructor(idCharacter, hability) {
        super(idCharacter)
        this.name = "Lobizón"
        this.hability = hability
        this.objective = "Eliminar a todo el pueblo"
        this.isLobizon = true
    }

    comerGente(idCharacter) {
        console.log(`${this.name} intenta comerse a ${idCharacter}`)
        return idCharacter 
    }

}