import { describe, expect, it } from "vitest";

import enProfile from "./locales/en/profile.json";
import frProfile from "./locales/fr/profile.json";

describe("profile locale files", () => {
  it("contains ProfileHome.successNoticeTitle in English", () => {
    expect(enProfile.ProfileHome.successNoticeTitle).toBe(
      "Your information was successfully updated in CanadaLogin",
    );
  });

  it("contains ProfileHome.successNoticeTitle in French", () => {
    expect(frProfile.ProfileHome.successNoticeTitle).toBe(
      "Vos renseignements ont été mis à jour avec succès dans ConnexionCanada",
    );
  });
});
