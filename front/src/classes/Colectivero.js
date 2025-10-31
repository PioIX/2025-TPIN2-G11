import Character from "./Character";

export default class Colectivero extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Colectivero"
        this.objective = "Linchar a todos los lobizones"
        this.nightlyOwls = []
    }

    
    seeNightlyOwls(nocturnalCharacters) {

        console.log(` COLECTIVERO observa movimientos nocturnos`)
        this.nightlyOwls = nocturnalCharacters.map(p => p.idCharacter)
        
        return {
            seen: this.nightlyOwls,
            amount: this.nightlyOwls.length,
            warning: "No sabe qué hicieron, solo que se levantaron"
        }
    }

    cleanObservations() {
        this.nightlyOwls = []
    }

    
}