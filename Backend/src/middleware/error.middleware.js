export function handleError(err, req, res, next) {
  console.error(err);
  if (err?.name === "MulterError") {
    return res.status(400).json({
      message: "File upload error",
      detail: err.message,
    });
  }

  if (err?.code === "23505") {
    let message = "A record with this value already exists";
    if (err?.constraint === "users_username_key") {
      message = "Username is already taken";
    } else if (err?.constraint === "users_email_key") {
      message = "Email is already registered";
    }

    return res.status(409).json({
      message,
    });
  }

  const response = {
    message: err.message,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }
  res.status(err.status || 500).json(response);
}

export default handleError;
