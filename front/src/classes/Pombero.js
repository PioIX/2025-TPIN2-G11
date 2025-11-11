import Character from "./Character";

export default class Pombero extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Pombero"
        this.objective = "Linchar a todos los lobizones"
        this.consecrated = []
        this.protectionsGranted = []
        this.activePowers = true
    }

    protectConsecrateds(idCharacter, consecrateds) {

        if (!this.activePowers) {
            console.log("El pombero perdió sus poderes")
            return null
        }

        const consecrated = consecrateds.find(c => c.idCharacter === idCharacter && c.consecratedToPombero)
        

        console.log(`POMBERO protege a ${idCharacter}`)
        this.protectionsGranted.push({
            protected: idCharacter,
            turn: Date.now(),
            isLobizon: consecrated.isLobizon
        })

        if (consecrated.isLobizon) {
            console.log("¡POMBERO PROTEGIÓ A UN LOBIZÓN! Pierde sus poderes y los lobizones podrán comer dos personas")
            this.activePowers = false
            return {
                protected: idCharacter,
                successful: true,
                consequence: "lobizon_protegido",
                message: "Los lobizones podrán atacar a dos personas esta noche"
            }
        }

        return {
            protected: idCharacter,
            successful: true,
            consequence: null
        }
    }

    registerConsecration(idCharacter) {
        if (!this.consecrateds.includes(idCharacter)) {
            this.consecrateds.push(idCharacter)
        }
    }

    selectNightProtected() {
        if (this.consecrateds.length === 0) return null
        
        //
    }
}