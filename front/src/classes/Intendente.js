import Personaje from "./Personaje";

export default class Intendente extends Personaje {
    constructor(idPersonaje, rolPrincipal) {
        super(idPersonaje)
        this.nombre = "Intendente"
        this.rolPrincipal = rolPrincipal 
        this.objetivo = this.rolPrincipal.objetivo
        this.planPlatitaUsado = false
        this.herederoDesignado = null
    }

   
    usarPlanPlatita(idObjetivo, conurbanenses) {
        
        if (this.planPlatitaUsado) {
            console.log("Plan Platita ya fue usado esta partida")
            return false
        }

        this.planPlatitaUsado = true
        console.log(`📋 INTENDENTE usa Plan Platita - Todos los Conurbanenses votarán por ${idObjetivo}`)

        conurbanenses.forEach(conurbanense => {
            if (conurbanense.estaVivo && conurbanense.puedeSerManipulado) {
                conurbanense.fueManipulado = true
                conurbanense.votoForzado = idObjetivo
            }
        })
        
        return true
    }

    designarHeredero(idHeredero) {
        this.herederoDesignado = idHeredero
        console.log(`👑 Intendente designa a ${idHeir} como su heredero`)
        return idHeredero
    }

    romperEmpate(empates) {
        //romper empate
       
    }
}