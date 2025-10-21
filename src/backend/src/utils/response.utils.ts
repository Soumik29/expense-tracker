import { type Response } from "express";

class Send {
  static success(res: Response, message = "Login Successful", data: any) {
    res.status(200).json({
      ok: true,
      message,
      data,
    });
    return;
  }

  static error(res: Response, message = "Internal Server Error", data: any) {
    res.status(500).json({
      ok: false,
      message,
      data: null,
    });
    return;
  }

  static notFound(res: Response, message = "404 Page not Found", data: any) {
    res.status(404).json({
      ok: false,
      message,
      data: null,
    });
    return;
  }

  static unauthorized(res: Response, message = "unauthorized", data: any) {
    res.status(401).json({
      ok: false,
      message,
      data: null,
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

  static forbidden(res: Response, data: any, message = "forbidden") {
    res.status(403).json({
      ok: false,
      data: null,
      message,
    });
    return;
  }

  static badRequest(res: Response, data: any, message = "bad request") {
    res.status(400).json({
      ok: false,
      data: null,
      message,
    });
    return;
  }
}

export default Send;
