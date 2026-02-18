import Lingo from "./api";

export { default as Lingo } from "./api";
export * from "./types";
export { default as LingoError } from "./lingoError";
export { parseIdentifier } from "./utils";

const lingo = new Lingo();
export default lingo;
