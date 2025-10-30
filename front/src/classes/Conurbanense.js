import Personaje from "./Personaje";

export default class Conurbanense extends Personaje {
    constructor(idPersonaje, habilidad) {
        super(idPersonaje)
        this.nombre = "Conurbanense"
        this.habilidad = habilidad
        this.objetivo = "Linchar a todos los lobizones"
        this.puedeSerManipulado = true
    }


}