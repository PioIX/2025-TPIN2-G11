import Character from "./Character";

export default class Jubilado extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Jubilado"
        this.objective = "Linchar a todos los lobizones"
        this.activatedRevenge = false
        this.assasin = null
    }

    activateRevenge(deathReason, objective = null) {

        console.log(`JUBILADO activa VENGANZA - Causa: ${deathReason}`)

        let victim = null

        switch (deathReason) {
            case "lobizon":
                victim = this.selectRandomLobizon(objective)
                break
            case "linchamiento":
                victim = objective
                break
            case "pocion_muerte":
                victim = objective
                break
        }

        if (victim) {
            console.log(`Jubilado se lleva consigo a ${victim}`)
            return {
                revenge: true,
                victim: victim,
                reason: deathReason
            }
        }

        return null
    }

    selectRandomLobizon(lobizones) {
        if (!lobizones || lobizones.length === 0) return null
        const aliveLobizones = lobizones.filter(wolf => wolf.isAlive)
        if (aliveLobizones.length === 0) return null
        return aliveLobizones[Math.floor(Math.random() * aliveLobizones.length)].idCharacter
    }

}