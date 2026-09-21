import { afterEach, describe, expect, it } from "vitest";
import { getAppPasswordHash } from "../lib/password";

const HASH = "$2b$10$xF/KxyGm7eHsiYeOo2ymKejdPUbqclrHQEFrGr2VTU5afVUpTNQza";

afterEach(() => {
  delete process.env.APP_PASSWORD_HASH_B64;
  delete process.env.APP_PASSWORD_HASH;
});

describe("getAppPasswordHash", () => {
  it("decodifica el hash desde base64", () => {
    process.env.APP_PASSWORD_HASH_B64 = Buffer.from(HASH).toString("base64");
    expect(getAppPasswordHash()).toBe(HASH);
  });

  it("acepta el hash crudo cuando no hay versión base64", () => {
    process.env.APP_PASSWORD_HASH = HASH;
    expect(getAppPasswordHash()).toBe(HASH);
  });

  it("rechaza un hash crudo corrompido por el parser de .env", () => {
    // Lo que queda cuando dotenv-expand se come los `$...`
    process.env.APP_PASSWORD_HASH = "/KxyGm7eHsiYeOo2ymKejdPUbqclrHQEFrGr2VTU5afVUpTNQza";
    expect(getAppPasswordHash()).toBeNull();
  });

  it("devuelve null cuando no hay ninguna variable configurada", () => {
    expect(getAppPasswordHash()).toBeNull();
  });
});
