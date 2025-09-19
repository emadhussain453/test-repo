function calculateAge(birthDate) {
    const today = new Date();
    const birthDateObj = new Date(birthDate);

    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDifference = today.getMonth() - birthDateObj.getMonth();

    // Check if the birth month has passed this year or if it is the birth month but the day hasn't passed
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDateObj.getDate())) {
        age -= 1;
    }

    return age;
}

export default calculateAge;
