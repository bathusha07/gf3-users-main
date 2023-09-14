import { Prisma } from '@prisma/client';
import ForeignKeyConstraintError from '../../domain/errors/ForeignKeyConstraintError';
import UniqueConstraintError from '../../domain/errors/UniqueConstraintError';

const ERROR_CODE_CONSTRAINT_UNIQUE = 'P2002';
const ERROR_CODE_CONSTRAINT_FOREIGN_KEY = 'P2003';

const handlePrismaError = (error: Error): Error => {
  const message = error.message.replace(/\n/gm, '');
  let code: string | null = null;
  let meta: Record<string, unknown> | undefined;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    code = error.code;
    meta = error.meta as Record<string, unknown>;
  } else {
    // Handles Prisma errors thrown from inside transactions, which currently throw a generic error
    // with the actual error stringified within the message. Bug documented at:
    //      https://github.com/prisma/prisma/issues/6166
    // TODO: remove this 'else' and the 'parseGenericPrismaError' function below when issue is fixed
    const result = parseGenericPrismaError(error);
    code = result.code;
    meta = result.meta as Record<string, unknown>;
  }

  if (code) {
    switch (code) {
      case ERROR_CODE_CONSTRAINT_FOREIGN_KEY:
        return new ForeignKeyConstraintError(message, meta);
        break;
      case ERROR_CODE_CONSTRAINT_UNIQUE:
        return new UniqueConstraintError(message, meta);
        break;
    }
  }

  return error;
};

const parseGenericPrismaError = (
  error: Error,
): { code: string | null; meta: Record<string, unknown> | undefined } => {
  let code: string | null = null;
  let meta: Record<string, unknown> | undefined;

  const matchErrorCode = /error_code: "(P[0-9]*)"/.exec(error.message);
  if (matchErrorCode) {
    code = matchErrorCode[1] ?? null;
  }
  if (code) {
    let match: RegExpMatchArray | null;
    switch (code) {
      case ERROR_CODE_CONSTRAINT_FOREIGN_KEY:
        match = /meta: Object\({"field_name": String\("(.*)"\)}\)/.exec(error.message);
        if (match) {
          meta = { field_name: match[1] };
        }
        break;
      case ERROR_CODE_CONSTRAINT_UNIQUE:
        match = /meta: Object\({"target": String\("(.*)"\)}\)/.exec(error.message);
        if (match) {
          meta = { target: match[1] };
        }
        break;
    }
  }
  return {
    code,
    meta,
  };
};

export default handlePrismaError;
