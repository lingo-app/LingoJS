import "regenerator-runtime/runtime";

import Lingo from "./api";

export * from "./types";
export { default as LingoError } from "./lingoError";

export default new Lingo();
