export default function authContext(req, res, next) {
  const id = req.header('x-user-id');
  const role = req.header('x-user-role');
  const name = req.header('x-user-name');
  if (id || role || name) {
    req.user = {
      id: id ? Number(id) : undefined,
      role: role || undefined,
      name: name || undefined
    };
  } else {
    req.user = null;
  }
  next();
}
