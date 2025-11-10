"use client";
import React from "react";
import RandomRole from "../../components/randomRole.js";
import { useState } from "react";
import Button from "@/components/button.js";

export default function Page() {
    const [playersAmount, setPlayersAmount] = useState(6);
    const [roles, setRoles] = useState([])

    const onChangePlayersAmount = (event) => {
        setPlayersAmount(Number(event.target.value));
    };

    function shuffle(array) {
        let currentIndex = array.length;

        while (currentIndex != 0) {

            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        let roles = ["Palermitano", "Conurbanense", "Conurbanense", "Medium", "Tarotista", "Lobizón", "Palermitano", "Lobizón", "Viuda negra", "Random1", "Conurbanense", "Lobizón", "Palermitano", "Random2", "Conurbanense", "Palermitano"];
        let random = ["Pombero", "Jubilado", "Chamán"];

        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < 16; j++) {
                if (roles[j] != "Random1") {
                    array[i] += ": ", roles[j];
                } else if (roles[j] == "Random1") {
                    let rand1 = Math.floor(Math.random() * random.length);
                    array[i] += ": ", random[rand1];
                } else if (roles[j] == "Random2") {
                    random.push("Colectivero");
                    let rand1 = Math.floor(Math.random() * random.length);
                    array[i] += ": ", random[rand1];
                    random.pop();
                }
            }
        }
    }

    // Used like so
    let arr = ["carlosGay", "invitad", "pepwpep", "pepi", "papa", "pape", "pepu", "ddd", "pipi", "0000"];
    shuffle(arr);
    console.log(arr);



    return (
        <>
            <input
                type="number"
                min="6"
                max="16"
                value={playersAmount}
                onChange={onChangePlayersAmount}
            />
            <Button
                onClick={randomRole}
                title="Aleatorizar rol" />
        </>
    );
}