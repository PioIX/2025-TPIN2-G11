import Personaje from "./Personaje";

export default class Colectivero extends Personaje {
    constructor(idPersonaje) {
        super(idPersonaje)
        this.nombre = "Colectivero"
        this.objetivo = "Linchar a todos los lobizones"
        this.noctambulos = []
    }

    
    observarNoctambulos(personajesNocturnos) {

        console.log(` COLECTIVERO observa movimientos nocturnos`)
        this.noctambulos = personajesNocturnos.map(p => p.idPersonaje)
        
        return {
            observados: this.noctambulos,
            cantidad: this.noctambulos.length,
            advertencia: "No sabe qué hicieron, solo que se levantaron"
        }
    }

    limpiarObservaciones() {
        this.noctambulos = []
    }

    
}