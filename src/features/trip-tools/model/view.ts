/* What the Tools SCREEN receives for one trip: the derived record, plus the two things the
   panels need that are not derivable from a guide's sections alone — the trip's own URL and
   its public-holiday reading (which needs the build-time holiday files).

   The type lives in the silo but the loader does not: assembling it requires `astro:content`,
   which belongs to the page layer. `src/pages/tools/_data.ts` is that loader. Keeping the
   shape here means the layout and the screen can both name it without either of them
   importing from a page. */

import type { ToolsRecord } from "./tools-record";
import type { HolidayInfo } from "../../../lib/holidays";

export interface TripTools {
  record: ToolsRecord;
  /** The trip's own guide page, for the "open the guide" link. */
  href: string;
  /** Public holidays around the trip dates; null when there is no data for that country-year. */
  holidays: HolidayInfo | null;
  /** Two-letter country code — null when the country is not in the gazetteer. */
  cc: string | null;
  /** Which portable exports this trip actually has a file for. Computed with the SAME
      collectors the .gpx/.ics endpoints use, so a link is never offered for a file that does
      not exist — the "Take it with you" row moved here from the guide's Share panel, where
      downloading a calendar had nothing to do with sharing anything with anyone. */
  exports: { gpx: boolean; ics: boolean };
}
