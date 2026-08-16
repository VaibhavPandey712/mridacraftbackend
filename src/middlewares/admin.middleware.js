function adminMiddleware(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: "You must be signed in to do that." });
    }
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();  
}

export default adminMiddleware;
