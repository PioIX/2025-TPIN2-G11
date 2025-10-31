import Character from "./Character";

export default class Lobizon extends Character {
    constructor(idCharacter, habilidad) {
        super(idCharacter)
        this.name = "Lobizón"
        this.habilidad = habilidad
        this.objective = "Eliminar a todo el pueblo"
        this.isLobizon = true
    }

    comerGente(idCharacter) {

        console.log(`${this.name} intenta comerse a ${idCharacter}`)
        return idCharacter 
    }

}