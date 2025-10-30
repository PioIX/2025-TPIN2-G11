import Character from "./Character";

export default class Tarotista extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Tarotista"
        this.objective = "Linchar a todos los lobizones"
        this.lecturasRealizadas = []
    }

   
    leerAura(idCharacter, personajeInvestigado) {

        this.lecturasRealizadas.push({
            objective: idCharacter,
            isLobizon: personajeInvestigado.isLobizon,
            turno: Date.now()
        })

        console.log(`🔮 TAROTISTA lee el aura de ${idCharacter}`)
        
        return {
            objective: idCharacter,
            isLobizon: personajeInvestigado.isLobizon,
            confiable: true 
        }
    }

    obtenerHistorial() {
        return this.lecturasRealizadas
    }

    
    
}