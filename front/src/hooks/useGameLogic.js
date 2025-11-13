"use client";

import { useCallback } from "react";

export const useGameLogic = (role, players) => {
    
    console.log("roles", role);
    console.log("jugadores", players)

    const checkWinner = useCallback(() => {
        if (!players || players.length === 0) {
            console.log(" No hay jugadores para verificar");
            return null;
        }
        
        const alivePlayers = players.filter(p => p.isAlive);
        console.log(alivePlayers)
        
        const aliveLobizones = alivePlayers.filter(p => 
            p.role === 'lobizón' || p.role === 'lobizon'
        );
        const aliveVillagers = alivePlayers.filter(p => 
            p.role !== 'lobizón' && p.role !== 'lobizon'
        );

        console.log("  Verificando ganador:", {
            totalJugadores: players.length,
            jugadoresVivos: alivePlayers.length,
            lobizonesVivos: aliveLobizones.length,
            aldeanosVivos: aliveVillagers.length,
            lobizones: aliveLobizones.map(p => p.username),
            aldeanos: aliveVillagers.map(p => p.username)
        });

        if (aliveLobizones.length === 0 && aliveVillagers.length > 0) {
            console.log(" ¡Ganan los aldeanos! No quedan lobizones");
            return {
                winner: "Aldeanos",
                message: "¡Los aldeanos han eliminado a todos los lobizones!",
                details: {
                    lobizonesRestantes: 0,
                    aldeanosRestantes: aliveVillagers.length
                }
            };
        }

        if (aliveLobizones.length >= aliveVillagers.length && aliveLobizones.length > 0) {
            console.log("¡Ganan los lobizones! Superan a los aldeanos");
            return {
                winner: "Lobizones",
                message: "¡Los lobizones han devorado a la aldea!",
                details: {
                    lobizonesRestantes: aliveLobizones.length,
                    aldeanosRestantes: aliveVillagers.length
                }
            };
        }

        if (alivePlayers.length === 1) {
            const lastPlayer = alivePlayers[0];
            const isLobizon = lastPlayer.role === 'lobizón' || lastPlayer.role === 'lobizon';
            console.log(`¡Solo queda 1 jugador! ${lastPlayer.username} (${isLobizon ? 'Lobizón' : 'Aldeano'})`);
            
            return {
                winner: isLobizon ? "Lobizones" : "Aldeanos",
                message: isLobizon 
                    ? `¡${lastPlayer.username} como lobizón ha devorado a la aldea!`
                    : `¡${lastPlayer.username} ha sobrevivido como aldeano!`,
                details: {
                    jugadorFinal: lastPlayer.username,
                    rolFinal: lastPlayer.role
                }
            };
        }

        console.log(" El juego continúa...");
        return null;
    }, []);

    return {
        checkWinner
    };
};