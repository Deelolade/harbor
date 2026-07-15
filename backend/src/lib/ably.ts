import { ABLY_API_KEY } from "../utils/env.js";
import Ably from "ably";

export const ably = new Ably.Rest(ABLY_API_KEY);
