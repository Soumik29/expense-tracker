import { type Response } from "express";

class Send {
  static success(res: Response, message = "Login Successful", data: object) {
    res.status(200).json({
      ok: true,
      message,
      data,
    });
    return;
  }

  static error(res: Response, message = "Internal Server Error", data?: null) {
    res.status(500).json({
      ok: false,
      message,
      data,
    });
    return;
  }

  static notFound(res: Response, message = "404 Page not Found", data: unknown) {
    res.status(404).json({
      ok: false,
      message,
      data,
    });
    return;
  }

  static unauthorized(res: Response, message = "unauthorized", data: unknown) {
    res.status(401).json({
      ok: false,
      message,
      data,
    });
    return;
  }

  static validationErrors(res: Response, errors: Record<string, string[]>) {
    res.status(422).json({
      ok: false,
      message: "Validation error",
      errors,
    });
    return;
  }

  static forbidden(res: Response, data: unknown, message = "forbidden") {
    res.status(403).json({
      ok: false,
      data,
      message,
    });
    return;
  }

  static badRequest(res: Response, data: unknown, message = "bad request") {
    res.status(400).json({
      ok: false,
      data,
      message,
    });
    return;
  }
}

export default Send;
