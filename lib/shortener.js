const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const BASE = ALPHABET.length;

const encode = num => {
    const arr = [];
    while (num > 0) {
        console.log(num);
        arr.push(ALPHABET.charAt(num % BASE));
        num = parseInt(num / BASE);
    }
    return arr.reverse().join('');
};

const decode = str => {
    let num = 0;
    for (let i = 0; i < str.length; i++) {
        num = num * BASE + ALPHABET.indexOf(str.charAt(i));
    }
    return num;
};

module.exports = {
    encode,
    decode,
};
