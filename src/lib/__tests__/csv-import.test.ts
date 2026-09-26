import { describe, it, expect } from "vitest";
import { parseCSV } from "../analytics/csv-import";

describe("parseCSV", () => {
  it("parses basic CSV", () => {
    const csv = `Name,AVG,HR,RBI
Julio Rodriguez,.282,28,85
Cal Raleigh,.232,32,80`;

    const { headers, rows } = parseCSV(csv);
    expect(headers).toEqual(["Name", "AVG", "HR", "RBI"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]["Name"]).toBe("Julio Rodriguez");
    expect(rows[0]["AVG"]).toBe(".282");
    expect(rows[0]["HR"]).toBe("28");
    expect(rows[1]["Name"]).toBe("Cal Raleigh");
  });

  it("handles quoted fields", () => {
    const csv = `Name,Team,Notes
"Smith, John","Seattle Mariners","He said ""hello"""`;

    const { rows } = parseCSV(csv);
    expect(rows[0]["Name"]).toBe("Smith, John");
    expect(rows[0]["Team"]).toBe("Seattle Mariners");
    expect(rows[0]["Notes"]).toBe('He said "hello"');
  });

  it("handles empty CSV", () => {
    const { headers, rows } = parseCSV("");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("handles header-only CSV", () => {
    const { headers, rows } = parseCSV("Name,AVG,HR");
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it("handles Windows-style line endings", () => {
    const csv = "Name,HR\r\nJulio,28\r\nCal,32";
    const { rows } = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]["HR"]).toBe("28");
  });
});
