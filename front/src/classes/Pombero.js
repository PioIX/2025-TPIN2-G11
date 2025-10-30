import Personaje from "./Personaje";

export default class Pombero extends Personaje {
    constructor(idPersonaje) {
        super(idPersonaje)
        this.nombre = "Pombero"
        this.objetivo = "Linchar a todos los lobizones"
        this.consagrados = []
        this.proteccionesOtorgadas = []
        this.poderesActivos = true
    }

    protegerConsagrado(idPersonaje, consagrados) {

        if (!this.poderesActivos) {
            console.log("El pombero perdió sus poderes")
            return null
        }

        const consagrado = consagrados.find(c => c.idPersonaje === idPersonaje && c.consagradoAlPombero)
        

        console.log(`POMBERO protege a ${idPersonaje}`)
        this.proteccionesOtorgadas.push({
            protegido: idPersonaje,
            turno: Date.now(),
            esLobizon: consagrado.esLobizon
        })

        if (consagrado.esLobizon) {
            console.log("¡POMBERO PROTEGIÓ A UN LOBIZÓN! Pierde sus poderes y los lobizones podrán comer dos personas")
            this.poderesActivos = false
            return {
                protegido: idPersonaje,
                exitoso: true,
                consecuencia: "lobizon_protegido",
                mensaje: "Los lobizones podrán atacar a dos personas esta noche"
            }
        }

        return {
            protegido: idPersonaje,
            exitoso: true,
            consecuencia: null
        }
    }

    registrarConsagracion(idPersonaje) {
        if (!this.consagrados.includes(idPersonaje)) {
            this.consagrados.push(idPersonaje)
        }
    }

    seleccionarProtegidoNocturno() {
        if (this.consagrados.length === 0) return null
        
        //
    }
}