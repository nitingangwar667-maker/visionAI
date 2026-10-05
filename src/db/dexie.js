import Dexie from "dexie";

export const db = new Dexie("GeoDrishtiLocalStore");
db.version(1).stores({
  outbox: "++id, lat, lon, is_mock, timestamp",
});
