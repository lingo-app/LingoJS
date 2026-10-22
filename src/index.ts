import Lingo from "./api";

export { default as Lingo } from "./api";
export * from "./types";
export { default as LingoError } from "./lingoError";
export { parseIdentifier } from "./utils";
export { ProductQuery, ProductSort } from "./products";

const lingo = new Lingo();
export default lingo;
