import { webByteUtils } from "./buffer";
import { Buffer } from "buffer";

export function randomBytes(byteLength) {
    return new Buffer(crypto.getRandomValues(webByteUtils.allocate(byteLength)));
}