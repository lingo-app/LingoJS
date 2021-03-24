// import "regenerator-runtime/runtime";

import Lingo from "./api";

export * from "./types";
export { default as LingoError } from "./lingoError";

const lingo = new Lingo();
export default lingo;
