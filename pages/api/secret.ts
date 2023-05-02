import { client } from "@/config/client";

//create function that returns sanity token
export function getToken() {
  const token = process.env.REACT_APP_SANITY_TOKEN;
  return token;
}

export function getProjectId() {
  const projectId = process.env.REACT_APP_SANITY_PROJECT_ID;
  return projectId;
}
