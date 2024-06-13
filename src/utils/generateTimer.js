function generateTimer(min, max) {
    const numSal = Math.random();

    const numeroAleatorio = Math.floor(numSal * (max - min + 1)) + min;

    return numeroAleatorio;
}

module.exports = { generateTimer };