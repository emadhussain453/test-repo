function padTo2Digits(num) {
    return num.toString().padStart(2, "0");
}

function convertMsToHM(milliseconds) {
    let seconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);

    seconds %= 60;
    // 👇️ if seconds are greater than 30, round minutes up (optional)
    minutes = seconds >= 30 ? minutes + 1 : minutes;
    minutes %= 60;
    hours %= 24;

    return `${padTo2Digits(hours)}:${padTo2Digits(minutes)}`;
}

export default convertMsToHM;
