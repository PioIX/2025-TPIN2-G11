import Character from "./Character";

export default class Medium extends Character {
    constructor(idCharacter) {
        super(idCharacter)
        this.name = "Medium"
        this.objective = "Linchar a todos los lobizones"
        this.deathVotes = 0
        this.deathsContacted = []
    }

    
    contactDeath(deads) {

        console.log(`MEDIUM contacta a los muertos: ${deads.length} espíritus`)
        this.deathsContacted = deads
        
        const deathVotes = this.obtainJointDeathVotes(deads)
        this.deathVotes = deathVotes
        
        return {
            jointVote: deathVotes,
            deathAmount: deads.length
        }
    }

    votarLinchar(idCharacter) {
        if (!this.isAlive) return null

        console.log(` MEDIUM vota por ${idCharacter} (2 votos: propio + muertos)`)
        return {
            personalVote: idCharacter,
            deathVotes: this.deathVotes,
            totalVotes: 2
        }
    }

    obtainJointDeathVotes(deads) {
        if (deads.length === 0) return null

        const votes = {}
        deads.forEach(dead => {
            const deathVote = this.calculateDeathVote(dead)
            if (deathVote) {
                votes[deathVote] = (votes[deathVote] || 0) + 1
            }
        })

        return Object.keys(votes).reduce((a, b) => 
            votes[a] > votes[b] ? a : b
        )
    }

    

}