function restriceAccessToQueuesAdminPage(req, res, next) {
    if (process.env.NODE_ENV !== "production") {
        return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
}
export default restriceAccessToQueuesAdminPage;
