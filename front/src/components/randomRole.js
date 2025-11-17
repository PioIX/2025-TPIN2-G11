export default function RandomRole({ array }) {
    const shuffledArray = [...array];
    let currentIndex = shuffledArray.length;

    // algoritmo Fisher-Yates (lo busqué en Google y lo copié y pegué qwertyuiop)
    while (currentIndex !== 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [shuffledArray[currentIndex], shuffledArray[randomIndex]] = [
            shuffledArray[randomIndex],
            shuffledArray[currentIndex],
        ];
    }

    const roles = [
        "Palermitano", "Conurbanense", "Conurbanense", "Medium",
        "Tarotista", "Lobizón", "Palermitano", "Lobizón",
        "Viuda negra", "Random1", "Conurbanense", "Lobizón",
        "Palermitano", "Random2", "Conurbanense", "Palermitano"
    ];

    const randomPool = ["Pombero", "Jubilado", "Chamán"];
    const usedRandomRoles = [];

    // Asignar roles
    const result = shuffledArray.map((item, i) => {

        let role = roles[i];
        if (role === "Random1" || role === "Random2") {
            if (roles.length > 13) {
                randomPool.push("Colectivero");
            }
            //rol aleatorio
            const randomIndex = Math.floor(Math.random() * randomPool.length);
            role = randomPool[randomIndex];
            usedRandomRoles.push(role);
            randomPool.splice(randomIndex, 1);


        }

        return `${item}: ${role}`;
    });

    return result;
}