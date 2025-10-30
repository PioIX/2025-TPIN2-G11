import Character from "./Character";

export default class Palermitano extends Character {
    constructor(idCharacter, habilidad) {
        super(idCharacter)
        this.name = "Palermitano"
        this.habilidad = habilidad
        this.objective = "Linchar a todos los lobizones"
        this.puedeSerManipulado = false 
    }


}