/* eslint no-undef: 0 */
const { Table } = require("./index");

const tableData = [
  [
    {
      data: "invalid table",
      hashes: false,
      rowsHash: false,
    },
    false,
  ],
  [
    {
      data: 42,
      hashes: false,
      rowsHash: false,
    },
    false,
  ],
  [
    {
      data: { invalid: "table" },
      hashes: false,
      rowsHash: false,
    },
    false,
  ],
  [
    {
      data: ["invalid", "table"],
      hashes: false,
      rowsHash: false,
    },
    false,
  ],
  [
    {
      data: [["invalid", "table"], ["invalid"]],
      hashes: false,
      rowsHash: false,
    },
    false,
  ],
  [
    {
      data: [["valid", "table"]],
      hashes: [],
      rowsHash: { valid: "table" },
    },
    true,
  ],
  [
    {
      data: [
        ["valid", "table"],
        ["multiple", "rows"],
      ],
      hashes: [{ valid: "multiple", table: "rows" }],
      rowsHash: { valid: "table", multiple: "rows" },
    },
    true,
  ],
  [
    {
      data: [
        ["valid", "table"],
        ["multiple", "rows"],
        ["and", "More"],
      ],
      hashes: [
        { valid: "multiple", table: "rows" },
        { valid: "and", table: "More" },
      ],
      rowsHash: { valid: "table", multiple: "rows", and: "More" },
    },
    true,
  ],
  [
    {
      data: [
        ["valid", 1],
        [2, "numbers"],
      ],
      hashes: [{ valid: 2, 1: "numbers" }],
      rowsHash: { valid: 1, 2: "numbers" },
    },
    true,
  ],
  [
    {
      data: [
        ["valid", "table", "with"],
        ["multiple", "rows", "data"],
        ["and", "many", "More"],
      ],
      hashes: [
        { valid: "multiple", table: "rows", with: "data" },
        { valid: "and", table: "many", with: "More" },
      ],
      rowsHash: false,
    },
    true,
  ],
];

describe("Creating data tables", () => {
  it.each(tableData)(
    "Only valid tables can be created",
    (tableData, expected) => {
      try {
        const table = new Table(tableData.data);
        if (!expected) {
          fail("table should not be created");
        }
        expect(table.data).toBe(tableData.data);
      } catch (err) {
        if (expected) {
          fail("Table should have been created but failed");
        }
        expect(err.message).toBe("Invalid table provided, please recheck");
      }
    }
  );
});

describe("Table.rows()", () => {
  it.each(tableData)(
    "Table.rows() returns correct data",
    (tableData, expected) => {
      if (!expected) {
        return;
      }
      const table = new Table(tableData.data);
      expect(table.rows()).toStrictEqual(tableData.data);
      expect(table.raw()).toStrictEqual(tableData.data);
    }
  );
});

describe("Table.hashes()", () => {
  it.each(tableData)(
    "Table.hashes() returns correct data",
    (tableData, expected) => {
      if (!expected) {
        return;
      }
      const table = new Table(tableData.data);
      expect(table.hashes()).toStrictEqual(tableData.hashes);
    }
  );
});

describe("Table.rowsHash()", () => {
  it.each(tableData)(
    "Table.rowsHash() returns correct data",
    (tableData, expected) => {
      if (!expected) {
        return;
      }
      try {
        const table = new Table(tableData.data);
        const hash = table.rowsHash();
        if (!tableData.rowsHash) {
          fail(
            "rowsHash should not be present for table with more than 2 columns"
          );
        }
        expect(hash).toStrictEqual(tableData.rowsHash);
      } catch (err) {
        if (tableData.rowsHash) {
          fail(err);
        }
        expect(err.message).toBe(
          "Cannot perform rowsHash on table with more than 2 columns"
        );
      }
    }
  );
});
