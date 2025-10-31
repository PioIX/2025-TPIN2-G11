import Character from "./Character";

export default class Pombero extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Pombero"
        this.objective = "Linchar a todos los lobizones"
        this.consagrados = []
        this.proteccionesOtorgadas = []
        this.poderesActivos = true
    }

    protegerConsagrado(idCharacter, consagrados) {

        if (!this.poderesActivos) {
            console.log("El pombero perdió sus poderes")
            return null
        }

        const consagrado = consagrados.find(c => c.idCharacter === idCharacter && c.consecratedToPombero)
        

        console.log(`POMBERO protege a ${idCharacter}`)
        this.proteccionesOtorgadas.push({
            protegido: idCharacter,
            turno: Date.now(),
            isLobizon: consagrado.isLobizon
        })

        if (consagrado.isLobizon) {
            console.log("¡POMBERO PROTEGIÓ A UN LOBIZÓN! Pierde sus poderes y los lobizones podrán comer dos personas")
            this.poderesActivos = false
            return {
                protegido: idCharacter,
                exitoso: true,
                consecuencia: "lobizon_protegido",
                mensaje: "Los lobizones podrán atacar a dos personas esta noche"
            }
        }

        return {
            protegido: idCharacter,
            exitoso: true,
            consecuencia: null
        }
    }

    registerConsecration(idCharacter) {
        if (!this.consagrados.includes(idCharacter)) {
            this.consagrados.push(idCharacter)
        }
    }

    seleccionarProtegidoNocturno() {
        if (this.consagrados.length === 0) return null
        
        //
    }
}