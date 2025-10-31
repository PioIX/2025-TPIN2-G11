import Character from "./Character";

export default class Intendente extends Character {
    constructor(idCharacter, principalRole) {
        super(idCharacter)
        this.name = "Intendente"
        this.principalRole = principalRole 
        this.objective = this.principalRole.objective
        this.usedPlanPlatita = false
        this.designatedHeir = null
    }

   
    usarPlanPlatita(idObjective, conurbanenses) {
        
        if (this.usedPlanPlatita) {
            console.log("Plan Platita ya fue usado esta partida")
            return false
        }

        this.usedPlanPlatita = true
        console.log(`📋 INTENDENTE usa Plan Platita - Todos los Conurbanenses votarán por ${idObjective}`)

        conurbanenses.forEach(conurbanense => {
            if (conurbanense.isAlive && conurbanense.canBeManipulated) {
                conurbanense.wasManipulated = true
                conurbanense.forcedVote = idObjective
            }
        })
        
        return true
    }

    designarHeredero(idHeir) {
        this.designatedHeir = idHeir
        console.log(`👑 Intendente designa a ${idHeir} como su heredero`)
        return idHeir

    }

    romperEmpate(draw) {
        //romper empate
       
    }
}