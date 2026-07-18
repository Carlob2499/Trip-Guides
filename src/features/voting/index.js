/** voting — the Group Vote panel (#tripVote): propose options, +1 to pick, share via link/QR.
    Options + tally are on-device (localStorage); the shareable link uses the tested base64url
    codec in model/vote-link.ts. Importing boots the UI. */
import "./ui/voting.js";

export { encodeVote, decodeVote, isVoteState } from "./model/vote-link";
