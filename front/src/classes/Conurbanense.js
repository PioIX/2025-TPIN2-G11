import Character from "./Character";

export default class Conurbanense extends Character {
    constructor(idCharacter, hability) {
        super(idCharacter)
        this.name = "Conurbanense"
        this.hability = hability
        this.objective = "Linchar a todos los lobizones"
        this.canBeManipulated = true
    }


}