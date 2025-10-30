import Personaje from "./Personaje";

export default class Tarotista extends Personaje {
    constructor(idPersonaje) {
        super(idPersonaje)
        this.nombre = "Tarotista"
        this.objetivo = "Linchar a todos los lobizones"
        this.lecturasRealizadas = []
    }

   
    leerAura(idPersonaje, personajeInvestigado) {

        this.lecturasRealizadas.push({
            objetivo: idPersonaje,
            esLobizon: personajeInvestigado.esLobizon,
            turno: Date.now()
        })

        console.log(`🔮 TAROTISTA lee el aura de ${idPersonaje}`)
        
        return {
            objetivo: idPersonaje,
            esLobizon: personajeInvestigado.esLobizon,
            confiable: true 
        }
    }

    obtenerHistorial() {
        return this.lecturasRealizadas
    }

    
    
}