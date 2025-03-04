import { client, clientWithToken } from "@/config/client";
import { SanityClient } from "@sanity/cli";

export async function deletePersonByName(
  personNameToDelete: string,
  sanityClient: SanityClient = clientWithToken
) {
  sanityClient
    .fetch(`*[_type == 'person' && name == $name]{_id}`, {
      name: personNameToDelete,
    })
    .then((result) => {
      if (result.length > 0) {
        const personId = result[0]._id;

        // Step 2: Delete the person document using the obtained _id
        sanityClient
          .delete(personId)
          .then(() => {
            console.log(`Successfully deleted ${personNameToDelete}`);
          })
          .catch((error) => {
            console.error("Deletion failed:", error);
          });
      } else {
        console.log(`No person found with the name ${personNameToDelete}`);
      }
    })
    .catch((error) => {
      console.error("Fetching person failed:", error);
    });
}

export function uuidv4() {
  // Public Domain/MIT
  var d = new Date().getTime(); //Timestamp
  var d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function uploadExternalImage(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const contentType = response.headers.get("content-type") || "image/jpeg"; // Provide a default value

  const asset = await clientWithToken.assets.upload("image", blob, { contentType });
  return asset;
}
