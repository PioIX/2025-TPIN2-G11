import Personaje from "./Personaje";

export default class Palermitano extends Personaje {
    constructor(idPersonaje, habilidad) {
        super(idPersonaje)
        this.nombre = "Palermitano"
        this.habilidad = habilidad
        this.objetivo = "Linchar a todos los lobizones"
        this.puedeSerManipulado = false 
    }


}