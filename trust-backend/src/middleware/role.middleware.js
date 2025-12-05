// src/middleware/role.middleware.js
export const requireRole = (roleName) => {
  // roleName: 'admin' or 'hospital' or 'user'
  return async (req, res, next) => {
    try {
      // req.user.roleId should be present (set during sign or decoded)
      // we will map roleId to name by querying roles table if roleName isn't numeric
      const roleId = req.user?.roleId;
      if (!roleId) return res.status(403).json({ error: 'Role not found' });
      // simple approach: assume roleId matches seeded id: admin=1, hospital=2, user=3
      const roleMap = { admin: 1, hospital: 2, user: 3 };
      if (roleMap[roleName] && roleMap[roleName] === roleId) return next();
      // allow admins to access anything
      if (roleId === roleMap.admin) return next();
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    } catch (err) {
      console.error('role check error', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };
};
