import Character from "./Character";

export default class Palermitano extends Character {
    constructor(idCharacter, hability) {
        super(idCharacter)
        this.name = "Palermitano"
        this.hability = hability
        this.objective = "Linchar a todos los lobizones"
        this.canBeManipulated = false 
    }


}