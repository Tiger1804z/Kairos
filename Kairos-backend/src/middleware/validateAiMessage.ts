import type { Request, Response, NextFunction } from "express";

const MAX_QUESTION_LENGTH = 2000;

export const validateAiMessage = (req: Request, res: Response, next: NextFunction) => {
  const question = req.body?.question;

  if (typeof question !== "string") {
    return res.status(400).json({ error: "INVALID_INPUT", message: "question must be a string" });
  }
  if (question.trim().length === 0) {
    return res.status(400).json({ error: "INVALID_INPUT", message: "question cannot be empty" });
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return res
      .status(400)
      .json({ error: "INVALID_INPUT", message: `question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters` });
  }

  next();
};
