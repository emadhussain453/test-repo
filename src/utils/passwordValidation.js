import { passwordStrength } from "check-password-strength";

export default {
    length: (password) => {
        if (password.length < 8) {
            return { status: 400, error: "Password must be at least 8 characters long" };
        }
        return true;
    },
    match: (password, confirmPassword) => {
        if (password !== confirmPassword) {
            return { status: 400, error: "Passwords do not match" };
        }
        return true;
    },
    strength: (password) => {
        if (passwordStrength(password).id < 2) {
            return { status: 400, error: "Password is too weak" };
        }
        return true;
    },
};
