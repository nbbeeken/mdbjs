import { webByteUtils } from "./web_byte_utils";
import { Buffer } from "buffer";

export function randomBytes(byteLength) {
    return new Buffer(crypto.getRandomValues(webByteUtils.allocate(byteLength)));
}