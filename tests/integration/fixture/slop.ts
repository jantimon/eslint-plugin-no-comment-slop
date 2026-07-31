interface RecordOptions {
  /** module to load */
  module: string;
  /** entry function name */
  fn: string;
  /** browser binary to launch */
  browser: string;
  url: string;
  // run without a window
  headless: boolean;
}

export const defaults: RecordOptions = {
  module: "index.mjs",
  fn: "run",
  browser: "chrome",
  url: "http://localhost",
  headless: true,
};
