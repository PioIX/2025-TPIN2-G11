import Personaje from "./Personaje";

export default class Lobizon extends Personaje {
    constructor(idPersonaje, habilidad) {
        super(idPersonaje)
        this.nombre = "Lobizón"
        this.habilidad = habilidad
        this.objetivo = "Eliminar a todo el pueblo"
        this.esLobizon = true
    }

    comerGente(idPersonaje) {

        console.log(`${this.nombre} intenta comerse a ${idPersonaje}`)
        return idPersonaje 
    }

}