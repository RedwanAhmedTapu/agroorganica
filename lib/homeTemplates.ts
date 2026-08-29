export type GridCell = { colSpan: number; rowSpan: number };

export type HomeGridTemplate = {
  id: string;
  name: string;
  description: string;
  /** number of columns the template's grid is divided into */
  cols: number;
  /** one cell per slot, in order — item[i] renders into cells[i] */
  cells: GridCell[];
};

// Every template has exactly 5 slots, so switching templates never
// gains or loses media — it only re-flows the same items into a new layout.
export const HOME_GRID_TEMPLATES: HomeGridTemplate[] = [
  {
    id: "spotlight",
    name: "Spotlight",
    description: "One large feature tile with four smaller tiles beside it.",
    cols: 4,
    cells: [
      { colSpan: 2, rowSpan: 2 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "even-row",
    name: "Even Row",
    description: "Five equal tiles in a single clean row.",
    cols: 5,
    cells: [
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "mosaic",
    name: "Mosaic",
    description: "A varied, editorial mix of tall, wide and square tiles.",
    cols: 4,
    cells: [
      { colSpan: 2, rowSpan: 2 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
    ],
  },
  {
    id: "banner-grid",
    name: "Banner + Grid",
    description: "A wide banner on top with four tiles underneath.",
    cols: 4,
    cells: [
      { colSpan: 4, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
    ],
  },
  {
    id: "big-two",
    name: "Big Two + Trio",
    description: "Two big showcase tiles above three smaller ones.",
    cols: 6,
    cells: [
      { colSpan: 3, rowSpan: 2 },
      { colSpan: 3, rowSpan: 2 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
      { colSpan: 2, rowSpan: 1 },
    ],
  },
];

export function getTemplate(id: string): HomeGridTemplate {
  return HOME_GRID_TEMPLATES.find((t) => t.id === id) ?? HOME_GRID_TEMPLATES[0];
}
